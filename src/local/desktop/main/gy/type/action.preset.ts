import { ActionInterface } from 'lib/gy/core/type/action'
import { DataRecord, Matrix, RawString } from 'lib/gy/core/type/primitive'
import { ProcedureDescriptor } from 'lib/gy/core/type/procedure'
import type { OpenAI } from 'openai'
import { HTMLItem, MouseTape } from 'type/app'

export type __Action__EditImage = ActionInterface<
  'EDIT_IMAGE',
  {
    title: RawString
    imageIds?: RawString
    imageUrls: RawString
    serializeOnly?: RawString
    // savePath?: RawString
  },
  {
    title: string
    imageIds: Matrix
    imageUrls: Matrix
    serializeOnly?: boolean
    // savePath?: string
  },
  Array<{ url: string; id: string }>
>

export type __Action__Select = ActionInterface<
  'SELECT',
  {
    options: RawString
    labels?: RawString
    defaultValueIndex?: RawString
    singular?: RawString
    separator?: RawString
    attach?: RawString
  },
  {
    options: Matrix
    labels?: Matrix
    separator?: string
    defaultValueIndex?: number
    singular?: boolean
    // attach?: Matrix
    attach?: number
  },
  Array<{ 값: string }>
>

export type __Action__Define = ActionInterface<
  'DEFINE',
  { record: Record<string, RawString>; confirm?: RawString; title?: RawString },
  { record: Record<string, Matrix>; confirm?: boolean; title?: string },
  Array<{ 값: string }>
>

export type __Action__LoadUrl = ActionInterface<
  'LOAD_URL',
  {
    url: RawString
    find?: RawString
    active?: RawString
    focused?: RawString
    header?: RawString
    rendererId?: RawString
    through?: RawString
    show?: RawString
  },
  {
    url: string
    find?: string
    active?: boolean
    focused?: boolean
    header?: boolean
    rendererId?: number | string
    through?: string
    show?: boolean
  },
  // { tab: chrome.tabs.CreateProperties; find?: RawString; header?: RawString },
  // { tab: chrome.tabs.CreateProperties; find?: boolean; header?: boolean },
  Array<{ URL: string; find: Array<string> }>
>

export type __Action__Scrape = ActionInterface<
  'SCRAPE',
  {
    origin: string
    items: Array<HTMLItem>
    scroll?: boolean
    pagination?: {
      // type: 'param' | 'path'
      selector: string
      frame?: string
      start?: string
      end?: string
      paramKey?: string
      pathIndex?: string
      contextPersistsOnPagination?: boolean
      newTab?: boolean
    }
  },
  {
    origin: string
    items: Array<HTMLItem>
    scroll?: boolean
    pagination?: {
      selector: string
      frame?: string
      start?: string
      end?: string
      paramKey?: string
      pathIndex?: string
      contextPersistsOnPagination?: boolean
      newTab?: boolean
    }
  },
  Array<{ Selector: string; Name: string; Frame?: string; Value: string; Number: 'singular' | 'plural' }>,
  ['binding-tab']
>

export type __Action__Download = ActionInterface<
  'DOWNLOAD',
  { url: string; headers: RawString; dir: string; base: string },
  { url: string; headers: Record<string, any>; dir: string; base: string }
>

export type __Action__Prompt = ActionInterface<'PROMPT', { defaultValue?: string }, { defaultValue?: string }>

export type __Action__Click = ActionInterface<
  'CLICK',
  {
    keepRatio?: boolean
    tapes: Array<MouseTape>
  },
  {
    keepRatio?: boolean
    tapes: Array<MouseTape>
  },
  Array<{ 좌표: string; 타입: '클릭' | '드래그' }>
>

export type __Action__Type = ActionInterface<'TYPE', { value: string }, { value: string }, Array<{ 값: string }>>

export type __Action__Extract = ActionInterface<
  'EXTRACT',
  { pattern: string; text: string },
  { pattern: string; text: string },
  Array<{ 대상: string; '추출된 값': string }>
>

export type __Action__ReadTextFile = ActionInterface<
  'READ_TEXT_FILE',
  { filePath: string; separators: [string, string] },
  { filePath: string; separators: [string, string] },
  Array<{ 파일: string; 구분자: string }>
>

export type __Action__EvalBindingTab = ActionInterface<
  'EVAL_BINDING_TAB',
  {
    /**
     * !!!!! IMPORTANT !!!!!
     * code should be not interpreted
     * as It can use template string ${} which can be considered as substitute
     */
    code: string
    params?: RawString
    rendererId?: RawString
    through?: RawString
  },
  {
    code: string
    params?: Array<{ id: string; value: any }>
    rendererId?: number | string
    through?: string
  },
  any,
  any,
  any
>

export type __Action__Pause = ActionInterface<'PAUSE'>

export type __Action__InitiateProcedure = ActionInterface<
  'INITIATE_PROCEDURE',
  { pid: string; config?: Partial<ProcedureDescriptor['config']>; idr: RawString },
  /**
   * should it be $idr and idr?
   */
  { pid: string; config?: Partial<ProcedureDescriptor['config']>; idr: DataRecord },
  any
>

export type __Action__OpenAIAssistant = ActionInterface<
  'OPEN_AI_ASSISTANT',
  {
    options: {
      apiKey: string
      assistantId: string
      initialMessage?: string
      responseFormat?: RawString
      model?: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['model']
      toolChoice?: RawString
      tools?: RawString
      toolBinding?: RawString
      temperature?: RawString
    }
    confirm?: RawString
  },
  {
    options: {
      apiKey: string
      assistantId: string
      initialMessage?: string
      responseFormat?: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['response_format']
      model?: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['model']
      toolChoice?: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['tool_choice']
      tools?: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['tools']
      toolBinding?: Record<string, { pid: string; sid: string }>
      temperature?: number
    }
    confirm?: boolean
  }
>

export type ActionPreset =
  | __Action__Define
  | __Action__Select
  | __Action__LoadUrl
  | __Action__Scrape
  // | __Action__Download
  // | __Action__Prompt
  | __Action__Type
  | __Action__Click
  | __Action__Extract
  // | __Action__ReadTextFile
  | __Action__EvalBindingTab
  | __Action__Pause
  | __Action__InitiateProcedure
  | __Action__OpenAIAssistant
  | __Action__EditImage
