import { EventMatrix } from 'lib/event/type'
import { $Action, Action, ActionInterfaceSuperset, ActionSchema } from 'lib/gy/core/type/action'
import { DataRecord, Matrix } from 'lib/gy/core/type/primitive'
import { ProcedureDescriptor, ProcedureSchema } from 'lib/gy/core/type/procedure'
import { DataTree } from 'lib/gy/core/type/tree'
import { Gy } from 'local/desktop/main/gy/init'
import { ActionPreset } from 'local/desktop/main/gy/type/action.preset'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import { ComponentUnion } from 'type/app'

export type DesignActionSchema<TAction extends ActionPreset = ActionPreset> = EventMatrix<
  'DESIGN_ACTION_SCHEMA',
  ComponentUnion,
  'MAIN',
  Partial<ActionSchema<TAction>>,
  ActionSchema<TAction>
>

export type InputActionSchema<TAction extends ActionPreset = ActionPreset> = EventMatrix<
  'INPUT_ACTION_SCHEMA',
  'MAIN',
  ComponentUnion,
  Partial<ActionSchema<TAction>>,
  ActionSchema<TAction>
>

export type GetProcedureSchema = EventMatrix<
  'GET_PROCEDURE_SCHEMA',
  ComponentUnion,
  'MAIN' | 'CONTENT_SCRIPT',
  { pid: string },
  ProcedureSchema
>

export type SetProcedureSchema =
  | EventMatrix<'SET_PROCEDURE_SCHEMA', 'MAIN', 'CONTENT_SCRIPT', ProcedureSchema>
  | EventMatrix<'SET_PROCEDURE_SCHEMA', 'CONTENT_SCRIPT', 'MAIN', ProcedureSchema>

export type UpdateProcedureSchema = EventMatrix<
  'UPDATE_PROCEDURE_SCHEMA',
  'CONTENT_SCRIPT',
  'MAIN',
  { schema: ProcedureSchema }
>

export type UpdateProcedureDescriptor = EventMatrix<
  'UPDATE_PROCEDURE_DESCRIPTOR',
  'CONTENT_SCRIPT',
  'MAIN',
  { partial: Partial<ProcedureDescriptor<TriggerPreset>> }
>

export type GetProcedureDescriptors = EventMatrix<
  'GET_PROCEDURE_DESCRIPTORS',
  ComponentUnion,
  ComponentUnion,
  undefined,
  Array<ProcedureDescriptor<TriggerPreset>>
>

export type CreateProcedureSchema = EventMatrix<
  'CREATE_PROCEDURE_SCHEMA',
  'CONTENT_SCRIPT',
  'MAIN',
  { schema: ProcedureSchema },
  { descriptor: ProcedureDescriptor<TriggerPreset> }
>

export type CopyProcedure = EventMatrix<
  'COPY_PROCEDURE',
  'CONTENT_SCRIPT',
  'MAIN',
  { pid: string },
  { schema: ProcedureSchema; descriptor: ProcedureDescriptor<TriggerPreset> }
>

export type SetProcedureDescriptors = EventMatrix<
  'SET_PROCEDURE_DESCRIPTORS',
  ComponentUnion,
  ComponentUnion,
  Array<ProcedureDescriptor<TriggerPreset>>
>

export type PostProcedureSchema = EventMatrix<'POST_PROCEDURE_SCHEMA', 'MAIN', 'SERVER', { schema: ProcedureSchema }>

export type PostProcedureDescriptor = EventMatrix<
  'POST_PROCEDURE_DESCRIPTOR',
  'MAIN',
  'SERVER',
  { descriptor: ProcedureDescriptor<TriggerPreset> }
>

export type FetchProcedureSchema = EventMatrix<
  'FETCH_PROCEDURE_SCHEMA',
  'MAIN',
  'SERVER',
  string,
  ProcedureSchema
  // Buffer
>

export type FetchProcedureDescriptors = EventMatrix<
  'FETCH_PROCEDURE_DESCRIPTORS',
  ComponentUnion,
  'SERVER',
  undefined,
  Array<ProcedureDescriptor<TriggerPreset>>
>

export type RemoveProcedures = EventMatrix<'REMOVE_PROCEDURES', ComponentUnion, 'MAIN' | 'SERVER', Array<string>>

// schema can change after register
// so you should capture at the moment
export type CreateSharedProcessSession = EventMatrix<
  'CREATE_SHARED_PROCESS_SESSION',
  'MAIN',
  'SERVER',
  { pid: string; allowed: Array<string> },
  { code: number; verbose?: string; sessionId?: string }
>

export type ParticipateSession = EventMatrix<'PARTICIPATE_SESSION', 'MAIN', 'SERVER', { sessionId: string }, boolean>

export type InitializeProcess = EventMatrix<
  'INITIALIZE_PROCESS',
  'BACKGROUND' | 'CONTENT_SCRIPT' | 'RENDERER',
  'MAIN',
  // {
  //   tab?: chrome.tabs.Tab
  //   pidOrPs: string | ProcedureSchema
  //   idr?: DataRecord
  //   resolveTree?: boolean
  //   config?: Partial<ProcedureDescriptor<TriggerPreset>['config']>
  // },
  Parameters<Gy['initiate']>['0'],
  { tidOrTree: DataTree | string; scriptValues: Record<string, Record<string, any>> }
>

export type Consume<T extends ActionInterfaceSuperset = ActionInterfaceSuperset> = EventMatrix<
  'CONSUME',
  ComponentUnion,
  'MAIN',
  { $action?: $Action<T>; action?: Action<T>; header?: { edr?: DataRecord } },
  T['returnType']
>

export type GetMatrixFromEdr = EventMatrix<
  'GET_MATRIX_FROM_EDR',
  ComponentUnion,
  'MAIN',
  { edrKey: string; substitute: string },
  Matrix
>
// export type ReqRegisterProcedure = EventMatrix<
//   'REQUEST_REGISTER_PROCEDURE',
//   'BACKGROUND' | 'CONTENT_SCRIPT',
//   'MAIN',
//   { tab?: chrome.tabs.Tab } & ({ ps: ProcedureSchema } | { pid: string } | { tid: string }),
//   DataTree
// >
