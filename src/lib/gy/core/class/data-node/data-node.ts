import { DataRecord } from '../../type/primitive'

export type DataNodeOptions = {
  parent?: string
  leaf?: boolean
  idr?: DataRecord
  cdr?: DataRecord
  id: string
}

export class DataNode {
  id: string

  idr: DataRecord

  cdr: DataRecord

  parent?: string

  leaf?: boolean

  constructor({ id, idr, cdr, leaf, parent }: DataNodeOptions) {
    this.id = id
    this.idr = idr || {}
    this.cdr = cdr || {}
    this.parent = parent
    this.leaf = leaf
  }

  get dr() {
    return { ...this.idr, ...this.cdr }
  }
}
