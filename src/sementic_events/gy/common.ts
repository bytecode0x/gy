import { EventMatrix } from 'lib/event/type'
import { Session } from 'lib/gy/core/class/session'
import { Action } from 'lib/gy/core/type/action'
import { Effect } from 'lib/gy/core/type/effect'
import { DataRecord, RawDataRecord } from 'lib/gy/core/type/primitive'
import { ProcedureSchema } from 'lib/gy/core/type/procedure'
import { Task } from 'lib/gy/core/type/task'
import { Gy } from 'local/desktop/main/gy/init'
import { ActionPreset } from 'local/desktop/main/gy/type/action.preset'
import { ComponentUnion, ExtensionStore } from 'type/app'
// export type Scrape = EventMatrix<
//   'SCRAPE',
//   'EXTENSION',
//   { tab: chrome.tabs.Tab; selector: string },
//   Array<{ text: string; href: string; src: string }>
// >

// export type GetImageFileAsDataUrl = EventMatrix<'GET_IMAGE_FILE_AS_DATA_URL', ComponentUnion, 'MAIN', undefined, string>

export type GetGyState = EventMatrix<'GET_GY_STATE', ComponentUnion, 'MAIN', undefined, Gy['state']>

export type SetGyState = EventMatrix<'SET_GY_STATE', ComponentUnion, 'MAIN', Partial<Gy['state']>>

export type HandShake = EventMatrix<'HANDSHAKE', 'CONTENT_SCRIPT', 'MAIN_WORLD', { secret: string }>

export type RenewRequestDetail = EventMatrix<
  'RENEW_REQUEST_DETAIL',
  'BACKGROUND',
  'MAIN',
  { origin: string; detail: chrome.webRequest.WebRequestHeadersDetails }
>

export type GetRequestDetail = EventMatrix<
  'GET_REQUEST_DETAIL',
  ComponentUnion,
  'MAIN',
  { origin: string },
  chrome.webRequest.WebRequestHeadersDetails
>

export type GetRequestDetails = EventMatrix<
  'GET_REQUEST_DETAILS',
  ComponentUnion,
  'MAIN',
  undefined,
  Record<string, chrome.webRequest.WebRequestHeadersDetails>
>

export type ExecuteAssistantRpc = EventMatrix<
  'EXECUTE_ASSISTANT_RPC',
  ComponentUnion,
  'MAIN',
  { function: { name: string; arguments: string } },
  any
>

export type CancelSchedule = EventMatrix<'CANCEL_SCHEDULE', ComponentUnion, ComponentUnion, string>

export type GetCalendar = EventMatrix<'GET_CALENDAR', ComponentUnion, ComponentUnion, undefined, Record<string, any>>

// export type GetClientPermission = EventMatrix<'GET_CLIENT_PERMISSION', ComponentUnion, 'MAIN', ClientPermissionSet>

// export type FetchClientPermission = EventMatrix<
//   'FETCH_CLIENT_PERMISSION',
//   'MAIN',
//   'SERVER',
//   undefined,
//   ClientPermissionSet
// >

export type BindCertificate = EventMatrix<
  'BIND_CERTIFICATE',
  'MAIN',
  'SERVER',
  { cid: string; hostName: string },
  string
>

export type UnbindCertificate = EventMatrix<'UNBIND_CERTIFICATE', 'MAIN', 'SERVER'>

export type Certificated = EventMatrix<'CERTIFICATED', 'MAIN', 'RENDERER'>

export type Memo = EventMatrix<'MEMO', 'MAIN', 'SERVER', string>

export type Lock = EventMatrix<'LOCK', 'MAIN', 'SERVER', string>

export type RenewCertificateToken = EventMatrix<'RENEW_CERTIFICATE_TOKEN', 'MAIN', 'SERVER', undefined, string>

export type GetLatestInstallerUrl = EventMatrix<'GET_LATEST_INSTALLER_URL', 'MAIN', 'SERVER', undefined, Array<string>>

export type GetLatestVersion = EventMatrix<'GET_LATEST_VERSION', 'MAIN', 'SERVER', undefined, string>

export type Preflight = EventMatrix<'PREFLIGHT', 'MAIN', 'SERVER', string, boolean>

export type DeleteCertificate = EventMatrix<'DELETE_CERTIFICATE', ComponentUnion, 'MAIN', { reason?: string }>

export type ConsumeTask = EventMatrix<'CONSUME_TASK', ComponentUnion, 'MAIN', { task: Task }, DataRecord>

export type PredicateRoute = EventMatrix<
  'PREDICATE_ROUTE',
  'MAIN',
  'RENDERER',
  { script: string; params: Array<{ id: string; value: any }>; async?: boolean },
  boolean
>

export type InvokeEffect = EventMatrix<
  'INVOKE_EFFECT',
  ComponentUnion,
  'MAIN',
  {
    pid?: string
    gdr?: DataRecord
    idr?: ProcedureSchema['idr']
    $cdr?: ProcedureSchema['$cdr']
    treePaths: Array<string>
    effect: Effect
    // scripts: Array<Script>
    overwriteGdr?: boolean
  },
  Record<string, Record<string, any>>
>

export type GetConsensus = EventMatrix<
  'GET_CONSENSUS',
  'SERVER',
  'MAIN',
  { host: string; nps: string; ips: string },
  boolean
>

// export type GetProcedureSchema = EventMatrix<
//   'GET_PROCEDURE_SCHEMA',
//   ComponentUnion,
//   ComponentUnion,
//   { ipr: string },
//   ProcedureSchema
// >

// procedure record id
export type GetTask =
  | EventMatrix<'GET_TASK', 'MAIN', 'SERVER', { ipr: string }, { code: number; verbose?: string; task?: Task }>
  | EventMatrix<'GET_TASK', 'SERVER', 'MAIN', { ipr: string }, { code: number; verbose?: string; task?: Task }>

// manager should create task records before return
export type SetDataRecord =
  | EventMatrix<'SET_DATA_RECORD', 'SERVER', 'MAIN', { code: number; verbose?: string; itr: string; dr: DataRecord }>
  | EventMatrix<'SET_DATA_RECORD', 'MAIN', 'SERVER', { code: number; verbose?: string; itr: string; dr: DataRecord }>

export type GetDataRecord =
  | EventMatrix<
      'GET_DATA_RECORD',
      'SERVER',
      'MAIN',
      { ipr: string },
      { code: number; verbose?: string; dr: DataRecord }
    >
  | EventMatrix<
      'GET_DATA_RECORD',
      'MAIN',
      'SERVER',
      { ipr: string },
      { code: number; verbose?: string; dr: DataRecord }
    >

export type ProcedureComplete = EventMatrix<'PROCEDURE_COMPLETE', 'SERVER', 'MAIN', { ipr: string }>

export type CancelTask = EventMatrix<
  'CANCEL_TASK',
  'MAIN',
  'SERVER',
  { code: number; verbose?: string; pid: string; tid: string }
>

export type GetSessions = EventMatrix<'GET_SESSIONS', ComponentUnion, 'MAIN', undefined, Record<string, Session>>

// procedure record id
// export type GetInstructionCode = EventMatrix<
//   'GET_INSTRUCTION_CODE',
//   'SERVER',
//   { procId: string },
//   { code: number; verbose?: string }
// >

// export type ScrapeBindingTab = EventMatrix<'SCRAPE_BINDING_TAB', 'TAB', Scrape['value']['items'], Scrape['returnType']>

export type EvaluateSubstitute = EventMatrix<
  'EVALUATE_SUBSTITUTE',
  ComponentUnion,
  'MAIN',
  // spreaded data record
  { expression: string; sdr: DataRecord },
  string
>

export type Interpret<T = any> = EventMatrix<
  'INTERPRET',
  ComponentUnion,
  'MAIN',
  { raw: string; header?: Record<string, any> },
  T
>

export type InterpretObj<T extends {} = any> = EventMatrix<
  'INTERPRET_OBJ',
  ComponentUnion,
  'MAIN',
  { raw: RawDataRecord; header?: Record<string, any> },
  T
>

export type Serialize = EventMatrix<
  'SERIALIZE',
  ComponentUnion,
  'MAIN',
  {
    value: any
    serializer: 'matrix' | 'json'
    options?: any
  },
  string
>

// export type Stringify = EventMatrix<
//   'STRINGIFY',
//   ComponentUnion,
//   'MAIN',
//   { data: Array<Array<string>>; joinWithEscaped: boolean | undefined },
//   string
// >

export type Pagination =
  | EventMatrix<'PAGINATION', 'MAIN', 'BACKGROUND', { tabId: number }, boolean>
  | EventMatrix<'PAGINATION', 'BACKGROUND', 'CONTENT_SCRIPT', undefined, boolean | undefined>

export type Command = EventMatrix<'COMMAND', ComponentUnion, 'MAIN', { order: string; params: any }>

// export type GetCertificate = EventMatrix<
//   'GET_CERTIFICATE',
//   ComponentUnion,
//   'MAIN',
//   undefined,
//   Local__Certificate | null | undefined
// >

// export type SetCertificate = EventMatrix<'SET_CERTIFICATE', 'MAIN', 'RENDERER', Local__Certificate>

// export type GetUser = EventMatrix<'GET_USER', ComponentUnion, 'MAIN', undefined, Local__User | null>

export type ReqCertificate = EventMatrix<'REQUEST_CERTIFICATE', ComponentUnion, 'MAIN'>

export type SetConnectionStatus = EventMatrix<
  'SET_CONNECTION_STATUS',
  ComponentUnion,
  'RENDERER',
  { component: string; connectivity: boolean }
>

export type Connect = EventMatrix<'CONNECT', 'RENDERER', 'MAIN', string>

export type AssertCertificate = EventMatrix<'ASSERT_CERTIFICATE', 'BACKGROUND', 'MAIN', undefined, boolean>

export type ResolveOnDocumentLoaded = EventMatrix<
  'RESOLVE_ON_DOCUMENT_LOADED',
  ComponentUnion,
  'CONTENT_SCRIPT',
  { tabId: number }
>

// export type GetTasks = EventMatrix<'GET_USER', 'MAIN', undefined, Array<TaskProps>>

// export type GetSchedules = EventMatrix<'GET_SCHEDULES', 'MAIN', undefined, Array<Schedule>>

export type GetExtensionStore =
  | EventMatrix<'GET_EXTENSION_STATE', ComponentUnion, 'CONTENT_SCRIPT', undefined, ExtensionStore>
  | EventMatrix<'GET_EXTENSION_STATE', ComponentUnion, 'MAIN' | 'SERVER', undefined, ExtensionStore>

export type SetExtensionStore =
  | EventMatrix<'SET_EXTENSION_STATE', ComponentUnion, 'CONTENT_SCRIPT', ExtensionStore, void>
  | EventMatrix<'SET_EXTENSION_STATE', ComponentUnion, 'MAIN' | 'SERVER', ExtensionStore, void>

// export type GetTriggers =
//   | EventMatrix<'GET_TRIGGERS', 'TAB', undefined, Array<Trigger>, { tabId: number }>
//   | EventMatrix<'GET_TRIGGERS', 'MAIN' | 'SERVER', undefined, Array<Trigger>>

// export type SetTriggers =
//   | EventMatrix<'SET_TRIGGERS', 'TAB', Array<Trigger>, void, { tabId: number }>
//   | EventMatrix<'SET_TRIGGERS', 'MAIN' | 'SERVER', Array<Trigger>, void>

export type ExtMounted = EventMatrix<'EXT_MOUNTED', ComponentUnion, 'MAIN' | 'BACKGROUND', chrome.tabs.Tab>

export type ExtUnMounted = EventMatrix<'EXT_UNMOUNTED', ComponentUnion, 'MAIN' | 'BACKGROUND', ExtensionStore>

export type ToggleApp = EventMatrix<'TOGGLE_APP', ComponentUnion, 'CONTENT_SCRIPT', undefined, boolean>

export type MountApp = EventMatrix<'MOUNT_APP', 'BACKGROUND', 'CONTENT_SCRIPT', ExtensionStore>

export type UnmountApp =
  | EventMatrix<'UNMOUNT_APP', 'MAIN', 'BACKGROUND', undefined, ExtensionStore>
  | EventMatrix<'UNMOUNT_APP', 'CONTENT_SCRIPT', 'BACKGROUND', ExtensionStore>
  | EventMatrix<'UNMOUNT_APP', 'BACKGROUND', 'CONTENT_SCRIPT', undefined, ExtensionStore>

export type CheckNativeConnection = EventMatrix<
  'CHECK_NATIVE_CONNECTION',
  ComponentUnion,
  'BACKGROUND',
  undefined,
  boolean
>

// export type CallInternalApi<TReturn = LocalHandle> = EventMatrix<
//   'CALL_INTERNAL_API',
//   'RENDERER',
//   'MAIN',
//   { api: string; param: any; scopeKey: string; handle?: LocalHandle },
//   TReturn
// >

/**
 * you can't send directly from main to content script or main world
 * because of the event like scrpae that including pagination which content-script can't deal with alone
 *
 * you can't pipe through background either
 * as background does something too
 */
export type Subcontract<T extends ActionPreset> =
  | EventMatrix<
      'SUBCONTRACT',
      'MAIN',
      'BACKGROUND',
      { tabId: number; action: Action<T>; command?: string; context?: any },
      T['returnType']
    >
  | EventMatrix<
      'SUBCONTRACT',
      'BACKGROUND',
      'CONTENT_SCRIPT',
      { action: Action<T>; command?: string; context?: any },
      T['returnType']
    >
  | EventMatrix<
      'SUBCONTRACT',
      'CONTENT_SCRIPT',
      'MAIN_WORLD',
      { action: Action<T>; command?: string; context?: any },
      T['returnType']
    >

// export type Forward<T extends ActionPreset> = EventMatrix<
//   'FORWARD',
//   'BACKGROUND' | 'CONTENT_SCRIPT',
//   'CONTENT_SCRIPT' | 'MAIN_WORLD',
//   { template: T['template']; value: T['value']; command?: string },
//   T['returnType']
// >
// | EventMatrix<
//     'FORWARD',
//     'CONTENT_SCRIPT',
//     'MAIN_WORLD',
//     { template: T['template']; value: T['value']; command?: string },
//     any
//     // { tabId: number }
//   >

export type SchemeAction<TAction extends ActionPreset> = EventMatrix<
  'SCHEME_ACTION',
  ComponentUnion,
  'MAIN',
  TAction['template'],
  TAction['schema']
>

export type ReqCheckAction<TAction extends ActionPreset> = EventMatrix<
  'REQ_CHECK_ACTION',
  ComponentUnion,
  'MAIN',
  TAction['template'],
  boolean
>

// | EventMatrix<
//     'DIALOG',
//     ComponentUnion,
//     'MAIN',
//     {
//       type: 'matrix'
//       header: string
//       defaultValue?: string
//       placeholder?: string
//       edr?: DataRecord
//     },
//     [string, Array<Array<string>>]
//   >
