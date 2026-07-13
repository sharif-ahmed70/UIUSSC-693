-- CM-5C1: Task submission, evidence links, review, revision, and approval workflow.

create or replace function public.cm5c1_is_safe_evidence_url(p_url text)
returns boolean
language plpgsql
immutable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_url text := btrim(coalesce(p_url, ''));
  v_lower text := lower(btrim(coalesce(p_url, '')));
begin
  if v_url = '' or length(v_url) > 2000 then
    return false;
  end if;

  if v_lower !~ '^https://[a-z0-9][a-z0-9.-]*(:[0-9]+)?(/|$)' then
    return false;
  end if;

  if v_lower ~ '^(javascript|data|file|vbscript):' then
    return false;
  end if;

  if v_lower ~ '([?&])(token|access_token|refresh_token|key|apikey|api_key|secret|password|signature|sig)=' then
    return false;
  end if;

  return true;
end;
$$;

create table if not exists public.event_task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.event_department_tasks(id) on delete restrict,
  submission_number integer not null,
  submitted_by uuid not null references public.volunteer_profiles(id) on delete restrict,
  submission_status text not null default 'submitted',
  summary text not null,
  completion_note text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.volunteer_profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  supersedes_submission_id uuid references public.event_task_submissions(id) on delete restrict,
  withdrawn_by uuid references public.volunteer_profiles(id) on delete set null,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_task_submissions_status_check check (submission_status in ('submitted', 'under_review', 'revision_requested', 'approved', 'withdrawn', 'superseded')),
  constraint event_task_submissions_summary_check check (btrim(summary) <> ''),
  constraint event_task_submissions_number_check check (submission_number > 0),
  constraint event_task_submissions_withdraw_reason_check check (submission_status <> 'withdrawn' or nullif(btrim(coalesce(withdrawal_reason, '')), '') is not null),
  constraint event_task_submissions_review_note_check check (submission_status <> 'revision_requested' or nullif(btrim(coalesce(review_note, '')), '') is not null)
);

create table if not exists public.event_task_submission_evidence_links (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.event_task_submissions(id) on delete restrict,
  evidence_type text not null default 'other',
  label text not null,
  url text not null,
  created_by uuid not null references public.volunteer_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint event_task_evidence_type_check check (evidence_type in ('document', 'design', 'spreadsheet', 'presentation', 'photo', 'video', 'folder', 'other')),
  constraint event_task_evidence_label_check check (btrim(label) <> ''),
  constraint event_task_evidence_url_check check (public.cm5c1_is_safe_evidence_url(url))
);

create table if not exists public.event_task_submission_history (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.event_task_submissions(id) on delete restrict,
  task_id uuid not null references public.event_department_tasks(id) on delete restrict,
  previous_status text,
  new_status text not null,
  actor_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);

create unique index if not exists event_task_submissions_task_number_idx on public.event_task_submissions (task_id, submission_number);
create unique index if not exists event_task_submissions_one_actionable_idx
  on public.event_task_submissions (task_id)
  where submission_status in ('submitted', 'under_review');
create index if not exists event_task_submissions_task_idx on public.event_task_submissions (task_id, submitted_at desc);
create index if not exists event_task_submissions_status_idx on public.event_task_submissions (submission_status);
create index if not exists event_task_submission_evidence_submission_idx on public.event_task_submission_evidence_links (submission_id);
create index if not exists event_task_submission_history_submission_idx on public.event_task_submission_history (submission_id, changed_at desc);

drop trigger if exists set_event_task_submissions_updated_at on public.event_task_submissions;
create trigger set_event_task_submissions_updated_at
before update on public.event_task_submissions
for each row execute function public.set_updated_at();

create or replace function public.can_view_event_task_submission(p_submission_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_submission public.event_task_submissions%rowtype;
begin
  select * into v_submission from public.event_task_submissions where id = p_submission_id;
  if not found then
    return false;
  end if;

  return public.can_view_event_task(v_submission.task_id);
end;
$$;

create or replace function public.cm5c1_latest_actionable_submission(p_task_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select id
  from public.event_task_submissions
  where task_id = p_task_id
    and submission_status in ('submitted', 'under_review')
  order by submitted_at desc
  limit 1
$$;

create or replace function public.cm5c1_can_review_task(p_task public.event_department_tasks)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.cm5b_has_task_permission('tasks.review', p_task.event_id, p_task.department_id)
    or public.cm5b_is_department_task_manager(p_task.department_id)
$$;

create or replace function public.submit_event_task_work(
  p_task_id uuid,
  p_summary text,
  p_completion_note text default null,
  p_evidence_links jsonb default '[]'::jsonb
)
returns table(submission_id uuid, submission_number integer, submission_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_task public.event_department_tasks%rowtype;
  v_submission public.event_task_submissions%rowtype;
  v_previous_submission public.event_task_submissions%rowtype;
  v_next_number integer;
  v_link jsonb;
  v_link_count integer;
  v_previous_task_status text;
begin
  select * into v_task from public.event_department_tasks where id = p_task_id for update;
  if v_actor is null or not found then
    raise exception 'Task not found' using errcode = '02000';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Task is not ready for submission' using errcode = '22023';
  end if;
  if v_task.progress_percent <> 100 then
    raise exception 'Progress must be 100%% before submission' using errcode = '22023';
  end if;
  if not public.cm5b_is_active_task_assignee(p_task_id) then
    raise exception 'You are not an active assignee' using errcode = '42501';
  end if;
  perform public.cm5b_assert_active_department_member(v_actor, v_task.department_id);

  if exists (
    select 1 from public.event_task_submissions
    where task_id = p_task_id and submission_status in ('submitted', 'under_review')
  ) then
    raise exception 'This submission is already under review' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_evidence_links, '[]'::jsonb)) <> 'array' then
    raise exception 'Evidence link payload is invalid' using errcode = '22023';
  end if;
  v_link_count := jsonb_array_length(coalesce(p_evidence_links, '[]'::jsonb));
  if v_link_count > 10 then
    raise exception 'Too many evidence links' using errcode = '22023';
  end if;

  select * into v_previous_submission
  from public.event_task_submissions
  where task_id = p_task_id and submission_status = 'revision_requested'
  order by submission_number desc
  limit 1
  for update;

  select coalesce(max(submission_number), 0) + 1 into v_next_number
  from public.event_task_submissions
  where task_id = p_task_id;

  if v_previous_submission.id is not null then
    update public.event_task_submissions
    set submission_status = 'superseded'
    where id = v_previous_submission.id;

    insert into public.event_task_submission_history (submission_id, task_id, previous_status, new_status, actor_profile_id, reason)
    values (v_previous_submission.id, p_task_id, 'revision_requested', 'superseded', v_actor, 'Superseded by a new submission version');
  end if;

  insert into public.event_task_submissions (
    task_id, submission_number, submitted_by, submission_status, summary, completion_note, supersedes_submission_id
  )
  values (
    p_task_id, v_next_number, v_actor, 'submitted', btrim(p_summary), nullif(btrim(coalesce(p_completion_note, '')), ''), v_previous_submission.id
  )
  returning * into v_submission;

  for v_link in select * from jsonb_array_elements(coalesce(p_evidence_links, '[]'::jsonb)) loop
    if not public.cm5c1_is_safe_evidence_url(v_link ->> 'url') then
      raise exception 'Evidence link is invalid' using errcode = '22023';
    end if;

    insert into public.event_task_submission_evidence_links (submission_id, evidence_type, label, url, created_by)
    values (
      v_submission.id,
      coalesce(nullif(v_link ->> 'evidenceType', ''), 'other'),
      btrim(coalesce(v_link ->> 'label', '')),
      btrim(v_link ->> 'url'),
      v_actor
    );
  end loop;

  insert into public.event_task_submission_history (submission_id, task_id, previous_status, new_status, actor_profile_id, reason, metadata)
  values (v_submission.id, p_task_id, null, 'submitted', v_actor, 'Work submitted for review', jsonb_build_object('evidence_link_count', v_link_count));

  v_previous_task_status := v_task.task_status;
  update public.event_department_tasks
  set task_status = 'ready_for_review',
      ready_for_review_at = now(),
      updated_by = v_actor
  where id = p_task_id
  returning * into v_task;

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason, metadata)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_previous_task_status, v_task.task_status, 100, 100, v_actor, 'Work submitted for review', jsonb_build_object('submission_id', v_submission.id, 'submission_number', v_submission.submission_number));

  perform public.write_club_audit_log('tasks.submit_work', 'event_task_submission', v_submission.id, v_task.department_id, jsonb_build_object('task_id', p_task_id, 'submission_number', v_submission.submission_number));
  return query select v_submission.id, v_submission.submission_number, v_submission.submission_status;
end;
$$;

create or replace function public.review_event_task_submission(
  p_submission_id uuid,
  p_decision text,
  p_review_note text default null
)
returns table(submission_id uuid, submission_status text, task_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_submission public.event_task_submissions%rowtype;
  v_task public.event_department_tasks%rowtype;
  v_previous_submission_status text;
  v_previous_task_status text;
begin
  if p_decision not in ('approve', 'request_revision') then
    raise exception 'Invalid review decision' using errcode = '22023';
  end if;

  select * into v_submission from public.event_task_submissions where id = p_submission_id for update;
  if v_actor is null or not found then
    raise exception 'Submission not found' using errcode = '02000';
  end if;
  select * into v_task from public.event_department_tasks where id = v_submission.task_id for update;

  if v_submission.submission_status not in ('submitted', 'under_review') then
    raise exception 'This submission has already been reviewed' using errcode = '22023';
  end if;
  if v_submission.submitted_by = v_actor then
    raise exception 'You cannot review your own submission' using errcode = '42501';
  end if;
  if not public.cm5c1_can_review_task(v_task) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_decision = 'request_revision' and nullif(btrim(coalesce(p_review_note, '')), '') is null then
    raise exception 'Revision feedback is required' using errcode = '22023';
  end if;
  if v_task.task_status in ('completed', 'cancelled') then
    raise exception 'Task is already closed' using errcode = '22023';
  end if;

  v_previous_submission_status := v_submission.submission_status;
  v_previous_task_status := v_task.task_status;

  if p_decision = 'approve' then
    update public.event_task_submissions
    set submission_status = 'approved',
        reviewed_by = v_actor,
        reviewed_at = now(),
        review_note = nullif(btrim(coalesce(p_review_note, '')), '')
    where id = p_submission_id
    returning * into v_submission;

    update public.event_department_tasks
    set task_status = 'completed',
        progress_percent = 100,
        completed_at = now(),
        updated_by = v_actor
    where id = v_task.id
    returning * into v_task;

    update public.event_task_assignees
    set assignment_status = 'completed'
    where task_id = v_task.id and assignment_status = 'active';
  else
    update public.event_task_submissions
    set submission_status = 'revision_requested',
        reviewed_by = v_actor,
        reviewed_at = now(),
        review_note = btrim(p_review_note)
    where id = p_submission_id
    returning * into v_submission;

    update public.event_department_tasks
    set task_status = 'in_progress',
        updated_by = v_actor
    where id = v_task.id
    returning * into v_task;
  end if;

  insert into public.event_task_submission_history (submission_id, task_id, previous_status, new_status, actor_profile_id, reason)
  values (v_submission.id, v_task.id, v_previous_submission_status, v_submission.submission_status, v_actor, nullif(btrim(coalesce(p_review_note, '')), ''));

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason, metadata)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_previous_task_status, v_task.task_status, 100, v_task.progress_percent, v_actor, nullif(btrim(coalesce(p_review_note, '')), ''), jsonb_build_object('submission_id', v_submission.id, 'decision', p_decision));

  perform public.write_club_audit_log('tasks.review_submission', 'event_task_submission', v_submission.id, v_task.department_id, jsonb_build_object('task_id', v_task.id, 'decision', p_decision));
  return query select v_submission.id, v_submission.submission_status, v_task.task_status;
end;
$$;

create or replace function public.withdraw_event_task_submission(p_submission_id uuid, p_reason text)
returns table(submission_id uuid, submission_status text, task_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.cm5b_current_approved_profile();
  v_submission public.event_task_submissions%rowtype;
  v_task public.event_department_tasks%rowtype;
  v_previous_submission_status text;
  v_previous_task_status text;
begin
  select * into v_submission from public.event_task_submissions where id = p_submission_id for update;
  if v_actor is null or not found then
    raise exception 'Submission not found' using errcode = '02000';
  end if;
  select * into v_task from public.event_department_tasks where id = v_submission.task_id for update;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Withdrawal reason is required' using errcode = '22023';
  end if;
  if v_submission.submission_status not in ('submitted', 'under_review') then
    raise exception 'This submission has already been reviewed' using errcode = '22023';
  end if;
  if not (v_submission.submitted_by = v_actor or public.cm5c1_can_review_task(v_task)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_previous_submission_status := v_submission.submission_status;
  v_previous_task_status := v_task.task_status;

  update public.event_task_submissions
  set submission_status = 'withdrawn',
      withdrawn_by = v_actor,
      withdrawn_at = now(),
      withdrawal_reason = btrim(p_reason)
  where id = p_submission_id
  returning * into v_submission;

  update public.event_department_tasks
  set task_status = 'in_progress',
      updated_by = v_actor
  where id = v_task.id and task_status <> 'cancelled'
  returning * into v_task;

  insert into public.event_task_submission_history (submission_id, task_id, previous_status, new_status, actor_profile_id, reason)
  values (v_submission.id, v_task.id, v_previous_submission_status, 'withdrawn', v_actor, p_reason);

  insert into public.event_task_status_history (task_id, event_department_assignment_id, event_id, department_id, previous_status, new_status, previous_progress, new_progress, actor_profile_id, reason, metadata)
  values (v_task.id, v_task.event_department_assignment_id, v_task.event_id, v_task.department_id, v_previous_task_status, v_task.task_status, v_task.progress_percent, v_task.progress_percent, v_actor, p_reason, jsonb_build_object('submission_id', v_submission.id));

  perform public.write_club_audit_log('tasks.withdraw_submission', 'event_task_submission', v_submission.id, v_task.department_id, jsonb_build_object('task_id', v_task.id));
  return query select v_submission.id, v_submission.submission_status, v_task.task_status;
end;
$$;

alter table public.event_task_submissions enable row level security;
alter table public.event_task_submission_evidence_links enable row level security;
alter table public.event_task_submission_history enable row level security;

revoke all on table public.event_task_submissions from anon, authenticated;
revoke all on table public.event_task_submission_evidence_links from anon, authenticated;
revoke all on table public.event_task_submission_history from anon, authenticated;

grant select on table public.event_task_submissions to authenticated;
grant select on table public.event_task_submission_evidence_links to authenticated;
grant select on table public.event_task_submission_history to authenticated;

drop policy if exists "Authorized users can read task submissions" on public.event_task_submissions;
create policy "Authorized users can read task submissions"
on public.event_task_submissions for select to authenticated
using (public.can_view_event_task(task_id));

drop policy if exists "Authorized users can read task evidence links" on public.event_task_submission_evidence_links;
create policy "Authorized users can read task evidence links"
on public.event_task_submission_evidence_links for select to authenticated
using (public.can_view_event_task_submission(submission_id));

drop policy if exists "Authorized users can read task submission history" on public.event_task_submission_history;
create policy "Authorized users can read task submission history"
on public.event_task_submission_history for select to authenticated
using (public.can_view_event_task(task_id));

revoke all on function public.cm5c1_is_safe_evidence_url(text) from public;
revoke all on function public.can_view_event_task_submission(uuid) from public;
revoke all on function public.cm5c1_latest_actionable_submission(uuid) from public;
revoke all on function public.cm5c1_can_review_task(public.event_department_tasks) from public;
revoke all on function public.submit_event_task_work(uuid, text, text, jsonb) from public;
revoke all on function public.review_event_task_submission(uuid, text, text) from public;
revoke all on function public.withdraw_event_task_submission(uuid, text) from public;

grant execute on function public.cm5c1_is_safe_evidence_url(text) to authenticated;
grant execute on function public.can_view_event_task_submission(uuid) to authenticated;
grant execute on function public.submit_event_task_work(uuid, text, text, jsonb) to authenticated;
grant execute on function public.review_event_task_submission(uuid, text, text) to authenticated;
grant execute on function public.withdraw_event_task_submission(uuid, text) to authenticated;
