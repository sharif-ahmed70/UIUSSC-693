const defaultPath = '/staff'

export function safeRedirectPath(value: string | null | undefined, fallback = defaultPath){
  if (!value) {
    return fallback
  }

  let decoded = value

  try {
    decoded = decodeURIComponent(value)
  } catch {
    return fallback
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return fallback
  }

  const lower = decoded.toLowerCase()

  if (lower.startsWith('/\\') || lower.includes('javascript:') || lower.includes('://')) {
    return fallback
  }

  return decoded
}
