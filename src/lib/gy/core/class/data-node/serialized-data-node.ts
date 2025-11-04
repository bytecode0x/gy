import { DataRecord } from '../../type/primitive'

export type SerializedDataNode = {
  id: string
  idr: DataRecord
  cdr: DataRecord
  parent?: string
  leaf?: boolean
}
