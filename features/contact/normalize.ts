import type { ContactCandidate, NormalizedContactMessage } from './types'

function collapseInlineWhitespace(value: string){
  return value.trim().replace(/\s+/g, ' ')
}

function normalizePlainMessage(value: string){
  return value
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
}

export function normalizeContactCandidate(candidate: ContactCandidate): NormalizedContactMessage {
  return {
    name: collapseInlineWhitespace(candidate.name),
    email: candidate.email.trim().toLowerCase(),
    subject: collapseInlineWhitespace(candidate.subject),
    message: normalizePlainMessage(candidate.message),
    website: candidate.website.trim(),
  }
}
