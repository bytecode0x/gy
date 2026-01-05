import { FetchTree, PostTree, QueryTreeAll } from 'lib/event/sementic'
import { DataTree } from 'lib/gy/core/type/tree'
import { getEvHandler } from 'local/desktop/main/infra/event/event-handler'

/**
 * in context of tree
 * records are created later than contents are
 * unlike procs and scripts
 */

export async function postTree(tree: DataTree) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<PostTree>({
    name: 'POST_TREE',
    payload: { tree },
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export async function fetchTree({ tid }: { tid: string }) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<FetchTree>({
    name: 'FETCH_TREE',
    payload: tid,
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}

export function queryTreeAll(params: QueryTreeAll['payload']) {
  const evHandler = getEvHandler()

  return evHandler.sendEvent<QueryTreeAll>({
    name: 'QUERY_TREE_ALL',
    // @ts-ignore
    payload: { unit: 50, index: 0, ...params },
    meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  })
}
