import { BrowserWindow } from 'electron'
import type { Resource } from 'lib/gy/core/class/resource'
import type { Action } from 'lib/gy/core/type/action'
import { ActionPreset } from './action.preset'

export type __Resource__BindingTab = Resource<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>

export type __Resource__ExtensionTab = Resource<Action<ActionPreset>, 'extension-tab', chrome.tabs.Tab>

export type __Resource__Window = Resource<any, 'window', BrowserWindow>

export type ResourcePreset = __Resource__BindingTab | __Resource__ExtensionTab | __Resource__Window
