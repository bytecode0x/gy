import { ComponentUnion } from 'lib/event/type'
import { ExtensionStore } from 'type'
import { EventMatrix } from '../interface/event'

export type GetTabId = EventMatrix<'GET_TAB_ID', 'CONTENT_SCRIPT', 'BACKGROUND', undefined, number>

export type QueryTabs = EventMatrix<
  'QUERY_TABS',
  ComponentUnion,
  'BACKGROUND',
  chrome.tabs.QueryInfo,
  Array<chrome.tabs.Tab>
>

export type GetTab = EventMatrix<
  'GET_TAB',
  ComponentUnion,
  'BACKGROUND',
  { tabId: number },
  chrome.tabs.Tab | null | undefined
>

export type CreateTab = EventMatrix<
  'CREATE_TAB',
  ComponentUnion,
  'BACKGROUND',
  chrome.tabs.CreateProperties,
  chrome.tabs.Tab
>

export type RemoveTab = EventMatrix<'REMOVE_TAB', ComponentUnion, 'BACKGROUND', number>

export type LoadUrl =
  | EventMatrix<'LOAD_URL', ComponentUnion, 'RENDERER', { url: string }, boolean>
  | EventMatrix<'LOAD_URL', ComponentUnion, 'BACKGROUND', { tabId: number; url: string }, boolean>

// export type ConnectNative = EventMatrix<'CONNECT_NATIVE', 'MAIN', 'BACKGROUND', undefined, boolean>

export type CreateContextMenuItem = EventMatrix<
  'CREATE_CONTEXT_MENU_ITEM',
  ComponentUnion,
  'BACKGROUND',
  { options: chrome.contextMenus.CreateProperties; pid: string }
>

export type RemoveContextMenuItem = EventMatrix<'REMOVE_CONTEXT_MENU_ITEM', ComponentUnion, 'BACKGROUND', string>

export type ContentScriptLoaded =
  | EventMatrix<'CONTENT_SCRIPT_LOADED', 'CONTENT_SCRIPT', 'BACKGROUND' | 'MAIN_WORLD'>
  | EventMatrix<'CONTENT_SCRIPT_LOADED', 'BACKGROUND', 'MAIN', { tabId: number; url: string }>

export type MountInterface = EventMatrix<'MOUNT_INTERFACE', 'BACKGROUND', 'CONTENT_SCRIPT', ExtensionStore>

export type UnmountInterface =
  | EventMatrix<'UNMOUNT_INTERFACE', 'MAIN', 'BACKGROUND', undefined, ExtensionStore>
  | EventMatrix<'UNMOUNT_INTERFACE', 'CONTENT_SCRIPT', 'BACKGROUND', ExtensionStore>
  | EventMatrix<'UNMOUNT_INTERFACE', 'BACKGROUND', 'CONTENT_SCRIPT', undefined, ExtensionStore>

export type HideInterface = EventMatrix<'HIDE_INTERFACE', ComponentUnion, ComponentUnion>

export type ShowInterface = EventMatrix<'SHOW_INTERFACE', ComponentUnion, ComponentUnion>

export type PopupLaunched = EventMatrix<'POPUP_LAUNCHED', 'POPUP', 'BACKGROUND'>

export type BackgroundReady = EventMatrix<'BACKGROUND_READY', 'BACKGROUND', 'MAIN'>
