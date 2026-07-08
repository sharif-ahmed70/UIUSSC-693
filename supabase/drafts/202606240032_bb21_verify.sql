-- BB-2.1 read-only verification.

do $$
declare
  v_priority_column integer;
  v_history_tables integer;
  v_assignment_columns integer;
  v_rpc_count integer;
begin
  select count(*) into v_priority_column
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'blood_requests'
    and column_name = 'priority';

  if v_priority_column <> 1 then
    raise exception 'blood_requests.priority is missing';
  end if;

  select count(*) into v_history_tables
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('blood_request_priority_history', 'blood_donor_availability_history');

  if v_history_tables <> 2 then
    raise exception 'Expected 2 BB-2.1 history tables, found %', v_history_tables;
  end if;

  select count(*) into v_assignment_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'blood_request_assignments'
    and column_name in ('action_label', 'due_at', 'completed_at', 'completion_note');

  if v_assignment_columns <> 4 then
    raise exception 'Expected 4 assignment action columns, found %', v_assignment_columns;
  end if;

  select count(*) into v_rpc_count
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname in ('change_blood_request_priority', 'complete_blood_request_assignment');

  if v_rpc_count <> 2 then
    raise exception 'Expected 2 BB-2.1 RPCs, found %', v_rpc_count;
  end if;
end;
$$;

select 'bb21_blood_workflow_hardening_verified' as result, now() as verified_at;
