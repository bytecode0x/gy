import { AppStore } from 'type/app'
import create, { StoreApi, UseBoundStore } from 'zustand'
/**
 * if project gets bigger, consider separating input, config in each stroe
 */

type Setter = {
  setState: (store: Partial<AppStore>) => void
}

type Api = StoreApi<AppStore & Setter>

let store: UseBoundStore<Api>

export function initStore(initialValue: AppStore) {
  store = create<AppStore & Setter>((set, get) => ({
    ...initialValue,
    setState: (partial) => set((state) => ({ ...state, ...partial }))
  }))

  return store
}

export function getStore() {
  return store
}
