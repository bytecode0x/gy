import { AliasUnion, ComponentUnion } from 'type/app';
import { EventMatrix } from '../lib/event/type';

export type Dialog =
  | EventMatrix<
      'DIALOG',
      ComponentUnion,
      'MAIN',
      { type: 'prompt'; header: string; placeholder?: string; defaultValue?: string },
      { value: string }
    >
  | EventMatrix<
      'DIALOG',
      ComponentUnion,
      'MAIN',
      {
        type: 'select'
        singular?: boolean
        required?: boolean
        header: string
        labels?: Array<string>
        options: Array<string>
        placeholder?: string
        defaultValueIndex?: number
      },
      {
        chosens: Array<string>
        indices: Array<number>
      }
    >
  | EventMatrix<
      'DIALOG',
      ComponentUnion,
      'MAIN',
      {
        type: 'form'
        header: string
        record: Record<string, string>
        placeholder?: string
        scopeKey?: string
        // edr?: DataRecord
        // edrKey?: string
      },
      {
        record: Record<string, string>
      }
    >
  | EventMatrix<
      'DIALOG',
      ComponentUnion,
      'MAIN',
      {
        type: 'image-editor'
        header: string
        width?: number
        height?: number
        serializeOnly?: boolean
        // imageUrls: Array<{ url: string; id: string }>
        imageUrls: Array<string>
        imageIds: Array<string>
      },
      {
        exports: Array<string>
        ids: Array<string>
      }
    >

export type GetBook = EventMatrix<
  'GET_BOOK',
  ComponentUnion,
  ComponentUnion,
  undefined,
  Partial<{ [K in AliasUnion]: { component: ComponentUnion; id: string | number } }>
>

export type SetBook = EventMatrix<
  'SET_BOOK',
  ComponentUnion,
  ComponentUnion,
  Partial<{ [K in AliasUnion]: { component: ComponentUnion; id: string | number } }>
>

export type SetState<S extends Record<string, any> = Record<string, any>, K extends keyof S = keyof S> =
  /**
   * type constraints on key and value prevent accessing on nested object
   */
  | EventMatrix<'SET_STATE', ComponentUnion, 'MAIN', Array<{ key: string; value: any }>>
  | EventMatrix<'SET_STATE', ComponentUnion, 'RENDERER' | 'CONTENT_SCRIPT', Partial<S>>

export type GetState<S extends Record<string, any> = Record<string, any>, T extends keyof S = keyof S> =
  // | EventMatrix<'GET_STATE', ComponentUnion, 'MAIN', Array<string>, Array<any>>
  EventMatrix<'GET_STATE', ComponentUnion, ComponentUnion, Array<T>, { [key in T]: S[key] }>

export type DeleteState<S extends Record<string, any> = Record<string, any>, T extends keyof S = keyof S> = EventMatrix<
  'DELETE_STATE',
  ComponentUnion,
  ComponentUnion,
  Array<T>
>

export type SetStore<S extends {} = {}> = EventMatrix<
  'SET_STORE',
  ComponentUnion,
  'MAIN' | 'RENDERER' | 'CONTENT_SCRIPT',
  S
>

export type GetStore<S extends {} = {}> = EventMatrix<
  'GET_STORE',
  ComponentUnion,
  'MAIN' | 'RENDERER' | 'CONTENT_SCRIPT',
  undefined,
  S
>

export type __Electron__LoadUrl = EventMatrix<'LOAD_URL', ComponentUnion, 'MAIN', { url: string; rendererId: number }>

export type FocusWindow = EventMatrix<'FOCUS_WINDOW', 'RENDERER', 'MAIN'>

export type CloseWindow = EventMatrix<'CLOSE_WINDOW', 'RENDERER', 'MAIN'>

export type MaximizeWindow = EventMatrix<'MAXIMIZE_WINDOW', 'RENDERER', 'MAIN'>

export type AlwaysOnTopWindow = EventMatrix<'ALWAYS_ON_TOP_WINDOW', 'RENDERER', 'MAIN', boolean>

export type SetVisible = EventMatrix<'SET_VISIBLE', 'RENDERER', 'MAIN', boolean>

export type GetWebContentsId = EventMatrix<'GET_WEBCONTENTS_ID', 'RENDERER', 'MAIN', undefined, number>

export type OpenExternal = EventMatrix<'OPEN_EXTERNAL', ComponentUnion, 'MAIN', { path: string }>

export type OpenFile = EventMatrix<'OPEN_FILE', ComponentUnion, 'MAIN', string, string>

export type Notify = EventMatrix<'NOTIFY', ComponentUnion, 'MAIN', Electron.NotificationConstructorOptions>

export type MessageBox = EventMatrix<'MESSAGE_BOX', ComponentUnion, 'MAIN', Electron.MessageBoxOptions>

export type SetStorageItem = EventMatrix<
  'SET_STORAGE_ITEM',
  ComponentUnion,
  ComponentUnion,
  { key: string; value: string }
>

export type GetStorageItem = EventMatrix<'GET_STORAGE_ITEM', ComponentUnion, ComponentUnion, string, string | null>

export type ThrowError = EventMatrix<'THROW_ERROR', ComponentUnion, 'MAIN', { id?: string; title: string; msg: string }>

export type GetWorkDir = EventMatrix<'GET_WORKDIR', 'RENDERER' | 'CONTENT_SCRIPT', 'MAIN', undefined, string>

export type SetWorkDir = EventMatrix<'SET_WORKDIR', 'RENDERER' | 'CONTENT_SCRIPT', 'MAIN', string>

export type OpenDialog = EventMatrix<
  'OPEN_DIALOG',
  ComponentUnion,
  'MAIN',
  Electron.OpenDialogOptions,
  Electron.OpenDialogReturnValue
>

export type ConsumeDeepLink = EventMatrix<'CONSUME_DEEP_LINK', 'RENDERER', 'MAIN', { url: string }>

export type RendererReady<T = any> = EventMatrix<'RENDERER_READY', 'RENDERER', 'MAIN', number, T>
