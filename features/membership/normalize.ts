import type { MembershipCandidate, NormalizedMembershipApplication } from './types'

function cleanText(value: string){
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeBangladeshPhone(value: string){
  const compact = value.trim().replace(/[\s\-()]/g, '')

  if (/^01\d{9}$/.test(compact)) {
    return `+88${compact}`
  }

  if (/^8801\d{9}$/.test(compact)) {
    return `+${compact}`
  }

  if (/^\+8801\d{9}$/.test(compact)) {
    return compact
  }

  return compact
}

export function normalizeMembershipCandidate(candidate: MembershipCandidate): NormalizedMembershipApplication {
  const skills = cleanText(candidate.skills)

  return {
    fullName: cleanText(candidate.fullName),
    studentId: cleanText(candidate.studentId).toUpperCase(),
    department: cleanText(candidate.department),
    trimester: cleanText(candidate.trimester),
    email: candidate.email.trim().toLowerCase(),
    phone: normalizeBangladeshPhone(candidate.phone),
    bloodGroup: cleanText(candidate.bloodGroup),
    interestedDepartment: cleanText(candidate.interestedDepartment),
    skills: skills.length > 0 ? skills : null,
    motivation: cleanText(candidate.motivation),
    website: candidate.website.trim(),
  }
}
