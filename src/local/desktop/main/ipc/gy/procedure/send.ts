import {
    FetchProcedureDescriptors,
    FetchProcedureSchema,
    PostProcedureDescriptor,
    PostProcedureSchema,
    RemoveProcedures
} from 'lib/event/sementic'
import { ProcedureDescriptor, ProcedureSchema } from 'lib/gy/core/type/procedure'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import { getEvHandler } from 'local/desktop/main/infra/event/event-handler'

export function postProcedureDescriptor({ descriptor }: { descriptor: ProcedureDescriptor<TriggerPreset> }) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<PostProcedureDescriptor>({
    name: 'POST_PROCEDURE_DESCRIPTOR',
    payload: { descriptor },
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function postProcedureSchema({ schema }: { schema: ProcedureSchema }) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<PostProcedureSchema>({
    name: 'POST_PROCEDURE_SCHEMA',
    payload: { schema },
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function fetchProcedureSchema({ pid }: { pid: string }) {
  const evHandler = getEvHandler()
  return evHandler.sendEvent<FetchProcedureSchema>({
    name: 'FETCH_PROCEDURE_SCHEMA',
    payload: pid,
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function fetchProcedureDescriptors() {
  const evHandler = getEvHandler()
  return evHandler.sendEvent<FetchProcedureDescriptors>({
    name: 'FETCH_PROCEDURE_DESCRIPTORS',
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function removeProcedures({ pids }: { pids: Array<string> }) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<RemoveProcedures>({
    name: 'REMOVE_PROCEDURES',
    payload: pids,
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}
