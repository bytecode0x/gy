import { Link } from '../link'
import { DataRecord, Matrix, RawDataRecord, RawString } from '../primitive'
import { TaskSchema201 } from '../task'

export type ProcedureSchema = ProcedureSchema201

// export type ProcedureSchema200 = {
//   id: string
//   constraint: Array<Array<string>>
//   cdr: RawDataRecord200
//   idr: DataRecord
//   tasks: Array<Array<TaskSchema200>>
//   links: Array<Array<Link>>
// }

export type ProcedureSchema201 = {
  name: string
  id: string
  $constraint: RawString
  constraint: Matrix
  $cdr: RawDataRecord
  idr: DataRecord
  $idr: RawDataRecord
  tasks: Array<Array<TaskSchema201>>
  links: Array<Array<Link>>
}
