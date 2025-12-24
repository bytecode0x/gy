export function getRandomColor() {
  return `#${Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, any> ? DeepPartial<T[K]> : T[K]
}
// unmutational deep merge
export function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const result = { ...base }

  for (const key in patch) {
    const value = patch[key]

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const baseValue = (base as any)[key] ?? {}
      result[key] = deepMerge(baseValue, value as any)
    } else {
      ;(result as any)[key] = value
    }
  }

  return result
}
