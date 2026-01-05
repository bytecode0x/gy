import { EventMatrix } from 'lib/event/interface'
import { Script, ScriptDescriptor } from 'lib/gy/core/type/script'
import { ComponentUnion } from 'type/app'

export type FetchScriptDescriptors = EventMatrix<
  'FETCH_SCRIPTS_DESCRIPTORS',
  ComponentUnion,
  'SERVER',
  undefined,
  Array<ScriptDescriptor>
>

export type FetchScript = EventMatrix<'FETCH_SCRIPT', ComponentUnion, 'SERVER', { sid: string }, Script>

export type PostScript = EventMatrix<'POST_SCRIPT', ComponentUnion, 'SERVER', { script: Script }>

export type PostScriptDescriptor = EventMatrix<
  'POST_SCRIPT_DESCRIPTOR',
  ComponentUnion,
  'SERVER',
  { descriptor: ScriptDescriptor }
>

export type RemoveScripts = EventMatrix<'REMOVE_SCRIPTS', ComponentUnion, 'MAIN' | 'SERVER', Array<string>>

export type GetScript = EventMatrix<'GET_SCRIPT', ComponentUnion, 'MAIN', { sid: string }, Script>

export type CreateScript = EventMatrix<
  'CREATE_SCRIPT',
  ComponentUnion,
  'MAIN',
  { name: string; code: string },
  { descriptor: ScriptDescriptor; script: Script }
>

export type UpdateScript = EventMatrix<'UPDATE_SCRIPT', ComponentUnion, 'MAIN', { partial: Partial<Script> }>

export type CopyScript = EventMatrix<
  'COPY_SCRIPT',
  ComponentUnion,
  'MAIN',
  { sid: string },
  { descriptor: ScriptDescriptor; script: Script }
>

export type UpdateScriptDescriptor = EventMatrix<
  'UPDATE_SCRIPT_DESCRIPTOR',
  ComponentUnion,
  'MAIN',
  { partial: Partial<ScriptDescriptor> }
>
