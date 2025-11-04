import { OverlayDiv } from 'lib/frame/sementic'
import React, { HTMLAttributes, ReactNode } from 'react'
import { ExtensionStore } from 'type/app'
import { v4 } from 'uuid'
import create, { StoreApi, UseBoundStore } from 'zustand'

/**
 * if project gets bigger, consider separating input, config in each stroe
 */

type Setter = {
  setState: (store: Partial<ExtensionStore>) => void
  // setConfig: (config: Partial<Config>) => void
}

/**
 * input : renderer => main
 * config : renderer request => main => renderer
 */

type Api = StoreApi<ExtensionStore & Setter>

let store: UseBoundStore<Api>

type OverlayStore = {
  overlay: Array<ReactNode>
  zIndex: number
  setOverlay: (overlay: Array<ReactNode>) => void
}
type Overlay = StoreApi<OverlayStore>

let overlay: UseBoundStore<Overlay>

export function initStore(initialValue: ExtensionStore) {
  store = create<ExtensionStore & Setter>((set, get) => ({
    ...initialValue,
    setState: (partial) => set((state) => ({ ...state, ...partial }))
    // setConfig: (config) => set((state) => ({ ...state, config: { ...state.config, ...config } }))
  }))
  overlay = create<OverlayStore>((set) => ({
    overlay: [],
    zIndex: 0,
    setOverlay: (overlay) => set((state) => ({ ...state, overlay }))
  }))
  return store
}

export function getStore() {
  return store
}

export function getOverlayStore() {
  return overlay
}

export function setOverlay(
  reactNode: ReactNode,
  onClear?: (ev: React.MouseEvent) => void,
  direction: 'upper' | 'lower' | 'static' = 'upper'
) {
  if (reactNode === null) {
    getOverlayStore().getState().setOverlay([])
    return function () {}
  }

  const { overlay: prev } = getOverlayStore().getState()

  // DetailedReactHTMLElement<HTMLAttributes<HTMLDialogElement>, HTMLDialogElement>
  const rfe = React.createElement<HTMLAttributes<HTMLDivElement>, HTMLDivElement>(
    OverlayDiv,
    {
      key: v4(),
      // @ts-ignore
      ref(_) {
        if (!_) return
        ;(_ as HTMLDivElement).style.zIndex = (
          direction === 'upper'
            ? ++getOverlayStore().getState().zIndex
            : direction === 'lower'
            ? --getOverlayStore().getState().zIndex
            : getOverlayStore().getState().zIndex
        ).toString()

        // dialog.onclose = function () {
        // }
      },
      onDoubleClick(e) {
        if (e.target !== e.currentTarget) return
        if (onClear) onClear(e)
        revert()
        // ;(e.currentTarget as HTMLDialogElement).close()
        // getOverlayStore().getState().setOverlay(prev)
      }
    },
    reactNode
  )

  getOverlayStore()
    .getState()
    .setOverlay([...prev, rfe])

  function revert() {
    const { overlay, setOverlay } = getOverlayStore().getState()
    setOverlay(overlay.filter((node) => node !== rfe))
  }

  return revert
}

// ***********************************************

// type ConfigSetter = {
//   setConfig: (config: Partial<Config>) => void
// }

// type ConfigStore = ConfigSetter & Config

// const initialConfig: Config =
//   process.env.NODE_ENV === 'production' ? window.eh.config : { workDir: '', rrule: {}, timeout: 30 }

// export const useConfig = create<ConfigStore>((set, get) => ({
//   ...initialConfig,
//   setConfig: (config) => set((state) => ({ ...state, ...config }))
// }))
