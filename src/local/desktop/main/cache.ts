const cache: Record<string, any> = {}

export function getCache() {
  return cache
}

export function addCacheItem({ key, value }: { key: string; value: any }) {
  if (key in value) throw new Error(`CACHE_CONFLICT:KEY_DUPLICATION:${key}`)
  cache[key] = value
}

export function removeCacheItem({ key }: { key: string }) {
  delete cache[key]
}

export function getCacheItem({ key }: { key: string }) {
  return cache[key]
}
