import { deepMerge, DeepPartial } from 'lib/util/common'
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
