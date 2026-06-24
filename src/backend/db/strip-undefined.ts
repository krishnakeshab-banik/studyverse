/** Recursively remove undefined values — Firestore rejects them on write. */
export function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== "object") {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .map(item => stripUndefined(item))
      .filter(item => item !== undefined) as T
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) {
      result[key] = stripUndefined(val)
    }
  }
  return result as T
}
