import type { ProcedureSchema } from 'lib/gy/core/type/procedure'
import type { Script } from 'lib/gy/core/type/script'
import type { Gy } from 'local/desktop/main/gy/init'

export type GyStore = Gy['state']

export type AppConfig = {
  alwaysOntop: boolean
  version: string
  extensionBrowser: string
  workDir: string
  maximumWorkers: number
  minimumPageLoadThreshold: number
  strict: boolean
  preserveTree: boolean
  language: 'kr' | 'en'
}

export type AppStore = {
  config: AppConfig
  gy: GyStore
  exConfig: ExtensionConfig
}

export type UserStore = {}

export type ExtensionGyCache = {
  cache: { procedures: Array<ProcedureSchema>; scripts: Array<Script> }
}

export type ExtensionStore = { gy: GyStore } & { config: ExtensionConfig } & ExtensionGyCache

export type ExtensionConfig = {
  theme: 'light' | 'dark'
  offset: { left: string; right: string }
  // workDir: string
}

export type ComponentUnion = 'MAIN' | 'RENDERER' | 'CONTENT_SCRIPT' | 'BACKGROUND' | 'SERVER' | 'MAIN_WORLD' | 'POPUP'

export type AliasUnion = 'MAIN' | 'USER' | 'DIALOG' | 'BACKGROUND' | 'EXTENSION_TAB' | 'POPUP'

// export type GyContext = {
//   session: Session
//   edr: DataRecord
//   sequence: Array<$Action<ActionInterfaceSuperset>>
//   eh: ReturnType<typeof getEvHandler>
// }

export type HTMLItem = {
  id: string
  name: string
  query: Array<{
    selector: string
    frame?: string
    number?: number
    exclusions: Array<number>
  }>
  /**
   * text : 001
   * href : 010
   * src : 100
   */
  target?: number
  /**
   * selector decides number
   */
  // plural?: boolean
  group?: string
  borderColor: string
}

export type MouseRecord = {
  x: number
  y: number
  duration: number
}

export type MouseTape = {
  name: string
  id: string
  color: string
  strict: boolean
  /**
   * this is so smart
   * element and screen can be considererd as same pattern
   * both has a domain in rectangle
   * we just need to know x, y coordinates in context of both element and screen
   * so you can think that context is a coordinate system
   *
   * and you can integrate click and drag as an one pattern too
   * click = drag with one length route
   * drag = click with a many point length route
   * both need to do hold and release mouse button
   * so Point which contains x,y coordinates is basically offset based on the context
   *
   * you need to take account of both designing and consuming
   */
  context: { name: 'screen' | 'element'; id: string; frame?: string }
  value: Array<Array<MouseRecord>>
}

export type __Local__Certificate = {
  id: string
  hid: string
  uid: string
  hostName: string
  userName: string
  email: string
  // permission: ClientPermissionSet
}
