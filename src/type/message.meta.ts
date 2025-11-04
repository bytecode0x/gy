import type { IpcMainEvent, IpcRendererEvent } from 'electron'

export type MainToRendererMeta = { native: { ipcRendererEvent: IpcRendererEvent } }

export type RendererToMainMeta = { native: { ipcMainEvent: IpcMainEvent } }

export type ContentScriptToBackgroundMeta = {
  native: { sender: chrome.runtime.MessageSender; reply: (response?: any) => void }
}

export type BackgroundToContentScriptMeta = {
  native: { sender: chrome.runtime.MessageSender; reply: (response?: any) => void }
}

export type PopupToBackgroundMeta = {
  native: { sender: chrome.runtime.MessageSender; reply: (response?: any) => void }
}

export type BackgroundToPopupMeta = {
  native: { sender: chrome.runtime.MessageSender; reply: (response?: any) => void }
}

export type MainWorldToContentScriptMeta = {
  secret: string
}

export type ContentScriptToMainWorldMeta = {
  secret: string
}
