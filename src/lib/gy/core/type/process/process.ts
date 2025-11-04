import { DataNode } from '../../class/data-node'
import { ActionInterfaceSuperset201 } from '../action'
import { DataRecord } from '../primitive'
import { ProcedureDescriptor, ProcedureSchema } from '../procedure'
import { Task, TaskSchema } from '../task'
import { DataTree } from '../tree'

export type ProcessOptions = {
  ipr: string
  ps: ProcedureSchema
  pd: ProcedureDescriptor
  idr: DataRecord
  id: string
  // gs: Record<string, boolean>
}

export class Process<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> {
  id: string

  ipr: string

  ps: ProcedureSchema

  pd: ProcedureDescriptor

  queue: Array<Task<TActionInterface>>

  // itr : iptr; pedigree
  miptr: Record<string, string>

  // itr : tr
  mtr: Record<string, Task<TActionInterface>>

  // itr : ts
  mts: Record<string, TaskSchema>

  // itr : raw dr
  mrdr: Record<string, DataRecord>

  // itr : spreaded data record
  midr: Record<string, DataRecord>

  // itr : array of spreading data record
  masdr: Record<string, Array<DataRecord>>

  // itr : common data record
  mcdr: Record<string, DataRecord>

  // itr : data node; idr + cdr
  mdn: Record<string, DataNode>

  // Array of leaf task record
  // ailtr: Array<string>

  idr: DataRecord

  // gs: Record<string, boolean>

  tree: DataTree

  browsingHistory: Set<string>

  constructor({ ipr, ps, pd, idr, id }: ProcessOptions) {
    /**
     * prefix
     * a : array
     * g : global
     * i : id
     * r : raw
     * p : parent
     * c : child
     * l : leaf
     * s : spreaded
     * m : map
     * acronym
     * ps : procedure schema
     * pr : procedure record
     * ts : task schema
     * tr : task record
     * as : action schema
     * ar : action record
     * s : spread
     */
    this.id = id
    this.ipr = ipr
    this.ps = ps
    this.pd = pd
    this.queue = []
    this.miptr = {}
    this.mts = {}
    this.mtr = {}
    this.mrdr = {}
    this.midr = {}
    this.masdr = {}
    this.mcdr = {}
    this.mdn = {}
    this.idr = idr
    // this.gs = gs
    this.browsingHistory = new Set<string>()

    const header = new DataNode({ idr: {}, id: '0' })

    this.mdn['0'] = header

    this.tree = { id: '', nodes: [header] }
  }

  // getTask
  getTr(itr: string) {
    return this.queue.find((tr) => tr.id === itr)
  }

  /**
   * fdr stands for Family Data Record
   * and It's aggregation of sdr of the family
   */

  getFdr(itr: string): DataRecord

  getFdr(tr: Task<TActionInterface> | null): DataRecord

  getFdr(itrOrTr: string | Task<TActionInterface> | null): DataRecord {
    if (itrOrTr === null) return this.idr
    let itr: string
    if (itrOrTr instanceof Object) itr = itrOrTr.id
    else itr = itrOrTr

    const dn = this.mdn[itr]
    // check parent exists
    if (!dn.parent) return dn.dr

    // if so, recursive to reduce it to family data record
    // dn.dr is created every time It's being referenced so no need to worry about assign
    // eslint-disable-next-line prefer-object-spread
    return Object.assign(dn.dr, this.getFdr(this.miptr[itr]))
  }

  getFamilyIds(itr: string): Array<string> {
    if (!this.miptr[itr] || this.miptr[itr] === '0') return [itr]
    return [itr].concat(this.getFamilyIds(this.miptr[itr]))
  }

  getAscendants(itr: string): Array<Task<TActionInterface>> {
    if (!this.miptr[itr] || this.miptr[itr] === '0') return []
    return [this.mtr[this.miptr[itr]]].concat(this.getAscendants(this.miptr[itr]))
  }

  getIdr(itr: string): DataRecord

  getIdr(tr: Task<TActionInterface> | null): DataRecord

  /**
   * sdr is the data record that was used for creating the task record
   */
  getIdr(itrOrTr: string | Task<TActionInterface> | null): DataRecord {
    if (itrOrTr === null) return {}
    let itr: string
    if (itrOrTr instanceof Object) itr = itrOrTr.id
    else itr = itrOrTr

    return this.mdn[itr].idr || {}
  }

  getCdr(itr: string): DataRecord

  getCdr(tr: Task<TActionInterface> | null): DataRecord

  /**
   * sdr is the data record that was used for creating the task record
   */
  getCdr(itrOrTr: string | Task<TActionInterface> | null): DataRecord {
    if (itrOrTr === null) return {}
    let itr: string
    if (itrOrTr instanceof Object) itr = itrOrTr.id
    else itr = itrOrTr

    return this.mdn[itr].cdr || {}
  }

  getTs(itr: string): TaskSchema

  getTs(tr: Task<TActionInterface>): TaskSchema

  getTs(itrOrTr: string | Task<TActionInterface>): TaskSchema {
    let itr: string
    if (itrOrTr instanceof Object) itr = itrOrTr.id
    else itr = itrOrTr

    const ts = this.mts[itr]

    if (!ts) throw new Error('NO_SCHEMA_MATCHED_IN_MTS')

    return ts
  }
}
