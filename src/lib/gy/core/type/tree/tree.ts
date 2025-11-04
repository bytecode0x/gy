import { DataNode, SerializedDataNode } from '../../class/data-node'

export type TreeDescriptor = {
  name: string
  alias: string
  keywords: Array<string>
  routes: Array<string>
  context: Array<string>
  require: Array<string>
  version: string
  tid: string
  pid: string
  hid: string
  cid: string
  date: number
  // size: number
  sequence: number
}

export type DataTree = {
  id: string
  nodes: Array<DataNode>
}

export type TreeFindOptions = Partial<TreeDescriptor>

// export type TreeFindOptions = Partial<{ [K in Exclude<keyof TreeDescriptor, 'date' | 'size'>]: Array<string> }>

export type SerializedDataTree = {
  id: string
  nodes: Array<SerializedDataNode>
}
