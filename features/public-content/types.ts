export type PublicQueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export function publicQueryError(operation: string, error: unknown){
  if(error && typeof error === 'object'){
    const maybeError = error as { code?: unknown; message?: unknown }
    console.error(operation, {
      code: typeof maybeError.code === 'string' ? maybeError.code : 'unknown',
      message: typeof maybeError.message === 'string' ? maybeError.message : 'Public content query failed',
    })
    return
  }

  console.error(operation, {
    code: 'unknown',
    message: 'Public content query failed',
  })
}
