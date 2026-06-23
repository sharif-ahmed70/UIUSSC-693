import type { EventRegistrationCandidate, NormalizedEventRegistration } from './types'

function collapseInlineWhitespace(value: string){
  return value.trim().replace(/\s+/g, ' ')
}

function nullIfEmpty(value: string){
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeBangladeshPhone(value: string){
  const compact = value.trim().replace(/[\s\-()]/g, '')

  if(/^01\d{9}$/.test(compact)){
    return `+88${compact}`
  }

  if(/^8801\d{9}$/.test(compact)){
    return `+${compact}`
  }

  if(/^\+8801\d{9}$/.test(compact)){
    return compact
  }

  return compact
}

export function normalizeEventRegistrationCandidate(
  candidate: EventRegistrationCandidate,
): NormalizedEventRegistration {
  const studentId = nullIfEmpty(candidate.studentId)
  const bloodGroup = nullIfEmpty(candidate.bloodGroup)
  const motivation = nullIfEmpty(candidate.motivation)

  return {
    eventSlug: candidate.eventSlug.trim().toLowerCase(),
    fullName: collapseInlineWhitespace(candidate.fullName),
    studentId: studentId ? collapseInlineWhitespace(studentId).toUpperCase() : null,
    email: candidate.email.trim().toLowerCase(),
    phone: normalizeBangladeshPhone(candidate.phone),
    bloodGroup,
    motivation: motivation ? motivation.trim() : null,
    website: candidate.website.trim(),
  }
}
