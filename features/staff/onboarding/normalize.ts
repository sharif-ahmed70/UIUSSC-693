export function normalizeStudentId(value: string){
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

export function normalizeBangladeshPhone(value: string){
  const compact = value.trim().replace(/[^\d+]/g, '')

  if (compact.startsWith('+880')) {
    return compact
  }

  if (compact.startsWith('880')) {
    return `+${compact}`
  }

  if (compact.startsWith('0')) {
    return `+88${compact}`
  }

  return compact
}
