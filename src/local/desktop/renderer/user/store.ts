import { AppStore } from 'type/app'
import create, { StoreApi, UseBoundStore } from 'zustand'
/**
 * if project gets bigger, consider separating input, config in each stroe
 */

export type SessionState = {}

type PersistentState = AppStore

export type UserState = {
  session: SessionState
  persistent: PersistentState
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, any> ? DeepPartial<T[K]> : T[K]
}

type Setter = {
  setState: (store: DeepPartial<UserState>) => void
}

type Api = StoreApi<UserState & Setter>

let store: UseBoundStore<Api>

export function initStore(persistent: PersistentState) {
  store = create<UserState & Setter>((set, get) => ({
    session: {},
    persistent,
    setState: (partial) => set((state) => deepMerge(state, partial))
  }))

  return store
}

export function getStore() {
  return store
}

// unmutational deep merge
function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
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
