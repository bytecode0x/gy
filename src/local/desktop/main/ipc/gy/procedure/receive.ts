import {
    CopyProcedure,
    CreateProcedureSchema,
    GetProcedureDescriptors,
    GetProcedureSchema,
    InitializeProcess,
    RemoveProcedures,
    UpdateProcedureDescriptor,
    UpdateProcedureSchema
} from 'lib/event/sementic'
import { setExtensionTab } from 'local/desktop/main/extension'
import { getGy } from 'local/desktop/main/gy/init'
import { getEvHandler } from 'local/desktop/main/infra/event/event-handler'

export function registerGyProcedureEventListeners() {
  const eh = getEvHandler()

  eh.onEvent<GetProcedureSchema>('GET_PROCEDURE_SCHEMA', async function ({ name, payload: { pid }, meta }) {
    const gy = getGy()

    return gy.readProcedureSchema({ pid })
  })

  eh.onEvent<UpdateProcedureSchema>('UPDATE_PROCEDURE_SCHEMA', async function ({ payload: { schema } }) {
    const gy = getGy()

    console.log('update event')

    return gy.updateProcedureSchema({ partial: schema })
  })

  eh.onEvent<UpdateProcedureDescriptor>('UPDATE_PROCEDURE_DESCRIPTOR', function ({ name, payload: { partial }, meta }) {
    const gy = getGy()

    return gy.updateProcedureDescriptor({ partial })
  })

  eh.onEvent<GetProcedureDescriptors>('GET_PROCEDURE_DESCRIPTORS', async function () {
    const gy = getGy()

    return gy.state.$procedures
  })

  eh.onEvent<CreateProcedureSchema>('CREATE_PROCEDURE_SCHEMA', async function ({ payload: { schema }, meta }) {
    const gy = getGy()

    return { descriptor: await gy.createProcedureSchema({ schema }) }
  })

  eh.onEvent<CopyProcedure>('COPY_PROCEDURE', async function ({ name, payload: { pid }, meta }) {
    const gy = getGy()

    return gy.copyProcedureSchema({ pid })
  })

  eh.onEvent<RemoveProcedures>('REMOVE_PROCEDURES', async function ({ name, payload: procedureIds, meta }) {
    const gy = getGy()

    await Promise.all(procedureIds.map((pid) => gy.deleteProcedure({ pid })))
  })

  eh.onEvent<InitializeProcess>('INITIALIZE_PROCESS', async function ({ payload, meta }) {
    const gy = getGy()

    // const extensionTab =
    //   getExtensionTab() ||
    //   (await eh.sendEvent<GetTab>({
    //     name: 'GET_TAB',
    //     payload: { tabId: meta.sender.id as number },
    //     meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
    //   }))

    // if (extensionTab && extensionTab.id)
    //   Object.assign(payload, {
    //     idr: {
    //       EXTENSION_TAB: [[`$<json|parse|${extensionTab.id.toString()}>`]],
    //       EXTENSION_TAB_URL: [[extensionTab.url]]
    //     }
    //   })

    const extensionTab = payload.resources?.['extension-tab']?.at(0)

    if (extensionTab) setExtensionTab(extensionTab)

    return gy.initiate({
      ...payload
    })
  })
}
