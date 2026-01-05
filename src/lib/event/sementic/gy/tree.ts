import { EventMatrix } from 'lib/event/interface'
import type { DataNode } from 'lib/gy/core/class/data-node'
import { SerializedDataTree, TreeDescriptor, TreeFindOptions } from 'lib/gy/core/type/tree'
import { ComponentUnion } from 'type/app'

export type PostTree = EventMatrix<'POST_TREE', ComponentUnion, 'SERVER', { tree: SerializedDataTree }>

export type PostTreeDescriptor = EventMatrix<'POST_TREE_RECORD', ComponentUnion, 'SERVER', { record: TreeDescriptor }>

export type FetchTree = EventMatrix<'FETCH_TREE', ComponentUnion, 'SERVER', string, SerializedDataTree>

export type QueryTreeAll = EventMatrix<
  'QUERY_TREE_ALL',
  'MAIN',
  'SERVER',
  { queryParams: Array<TreeFindOptions>; index?: number; unit?: number },
  [Array<TreeDescriptor>, number]
>

// export type QueryTreeAll = EventMatrix<
//   'QUERY_TREE_ALL',
//   ComponentUnion,
//   'MAIN',
//   { queryParams: Array<TreeFindOptions>; index?: number; unit?: number },
//   [Array<TreeDescriptor>, number]
// >

export type SetTreeDescriptorName =
  | EventMatrix<'SET_TREE_RECORD_NAME', 'CONTENT_SCRIPT', 'MAIN', { tid: string; name: string }>
  | EventMatrix<'SET_TREE_RECORD_NAME', 'MAIN', 'SERVER', { tid: string; name: string }>

export type MergeTrees = EventMatrix<
  'MERGE_TREES',
  ComponentUnion,
  'SERVER',
  { atid: Array<string>; root: DataNode },
  TreeDescriptor
>

export type RemoveTrees = EventMatrix<'REMOVE_TREES', ComponentUnion, 'SERVER', Array<string>>
