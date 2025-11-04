import { Notification } from 'electron'
import { DataNode } from 'lib/gy/core/class/data-node'
import { getGy } from 'local/desktop/main/gy/init'
import { getEvHandler } from 'local/desktop/main/infra/event/event-handler'
import path from 'path'
import {
  CopyScript,
  CreateScript,
  GetScript,
  InvokeEffect,
  RemoveScripts,
  UpdateScript,
  UpdateScriptDescriptor
} from 'sementic_events'
import { fetchTree } from '../tree'

export function registerGyScriptEventListeners() {
  const evHandler = getEvHandler()

  evHandler.onEvent<GetScript>('GET_SCRIPT', async function ({ payload: { sid } }) {
    const gy = getGy()

    return gy.readScript({ sid })
  })

  evHandler.onEvent<CreateScript>('CREATE_SCRIPT', function ({ payload: { name, code }, meta }) {
    const gy = getGy()

    return gy.createScript({ name, code })
  })

  evHandler.onEvent<CopyScript>('COPY_SCRIPT', function ({ name, payload: { sid }, meta }) {
    const gy = getGy()

    return gy.copyScript({ sid })
  })

  evHandler.onEvent<RemoveScripts>('REMOVE_SCRIPTS', async function ({ name, payload: sids, meta }) {
    const gy = getGy()

    await Promise.all(sids.map((sid) => gy.deleteScript({ sid })))
  })

  evHandler.onEvent<UpdateScript>('UPDATE_SCRIPT', async function ({ payload: { partial } }) {
    const gy = getGy()

    return gy.updateScript({ partial })
  })

  evHandler.onEvent<UpdateScriptDescriptor>('UPDATE_SCRIPT_DESCRIPTOR', async function ({ payload: { partial } }) {
    const gy = getGy()

    return gy.updateScriptDescriptor({ partial })
  })

  evHandler.onEvent<InvokeEffect>('INVOKE_EFFECT', async function ({ payload }) {
    // if (!('atid' in payload)) throw new Error('NO_TREE_MATCHED')

    // const merged = await mergeTrees(treeOrTids)

    const gy = getGy()

    const trees = await Promise.all(
      payload.treePaths.map((treePath) =>
        gy.readTree({ treePath }).then((tree) => tree || fetchTree({ tid: path.parse(treePath).name }))
      )
    ).then((trees) => trees.map((tree) => ({ ...tree, nodes: tree.nodes.map((node) => new DataNode(node)) })))

    return gy
      .invoke({ ...payload, trees })
      .then(function (scriptReturnValues) {
        logger.info('effect resolved', { source: 'manager' })
        new Notification({ title: 'Gatsby', body: `Effect resolved` }).show()
        return scriptReturnValues
      })
      .catch(function (err) {
        logger.error('failed to resolve effect', { source: 'manager', err: err.message })
        new Notification({
          title: 'Gatsby',
          body: `Failed to resolve effect\n${err?.message || 'unknown reason'}`
        }).show()
        throw err
      })
  })
}
