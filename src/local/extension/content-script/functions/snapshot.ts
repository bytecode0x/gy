import { DataNode } from 'lib/gy/core/class/data-node'
import { ActionInterfaceSuperset, ActionSchema } from 'lib/gy/core/type/action'
import { DataRecord } from 'lib/gy/core/type/primitive'
import { ProcedureSchema } from 'lib/gy/core/type/procedure'
import { TaskSchema } from 'lib/gy/core/type/task'
import { DataTree } from 'lib/gy/core/type/tree'
import { SNAPSHOT_MAX_COL_LENGTH, SNAPSHOT_MAX_ROW_LENGTH } from '../const'
import { getStore } from '../store'

// this is not a data tree strictly
export function getPseudoDataTreeSnapshot(ps: ProcedureSchema): DataTree {
  const links = ps.links.flat()
  const tasks = ps.tasks.flat()
  const root = getStore().getState().gy.gdr

  return {
    id: `tree_snapshot_on_${ps.id}`,
    nodes: [new DataNode({ id: '0', cdr: root, idr: {} })].concat(
      tasks.flat().map((ts) => {
        // @ts-ignore
        const dr = ts.actions.reduce((prev, curr) => Object.assign(prev, curr.snapshot), {}) as DataRecord
        // @ts-ignore
        const spread = ts.actions.reduce((prev, curr) => Object.assign(prev, curr.spread), {}) as Record<
          string,
          boolean
        >

        // const cdr = Object.fromEntries(Object.entries(dr).filter(([key]) => spread[key] !== true))

        // const idr = Object.fromEntries(Object.entries(dr).filter(([key]) => !spread[key]))

        return new DataNode({
          id: ts.id,
          cdr: Object.fromEntries(
            Object.entries(dr).map(([key, matrix], index) =>
              spread[key]
                ? [
                    key,
                    matrix.slice(0, 1)
                    // .map((col) => col.slice(0, SNAPSHOT_MAX_COL_LENGTH).map((v) => v.slice(0, SNAPSHOT_MAX_DATA_LENGTH)))
                  ]
                : [
                    key,
                    matrix
                    // .slice(0, SNAPSHOT_MAX_ROW_LENGTH)
                    // .map((col) => col.slice(0, SNAPSHOT_MAX_COL_LENGTH).map((v) => v.slice(0, SNAPSHOT_MAX_DATA_LENGTH)))
                  ]
            )
          ),
          idr: {},
          leaf: ts.leaf,
          parent: links.find((l) => l.dest === ts.id)?.src || '0'
        })
      })
    )
  }
}

export function getMergedSnapshot(ps: ProcedureSchema): DataRecord {
  return ps.tasks
    .flat()
    .flatMap((ts) => ts.actions.flat())
    .reduce((prev, curr) => Object.assign(prev, curr.snapshot), {})
}

export function getUpperSnapshots(ps: ProcedureSchema, ts: TaskSchema): Array<ActionInterfaceSuperset['returnType']> {
  if (!ps) throw new Error('FUNCTIONS:GET_UPPER_SNAPSHOTS:NO_PS_MATCHED')
  const link = ps.links.flat().find((l) => l.dest === ts.id)
  if (!link) return [ps.idr]
  const parentTask = ps.tasks.flat().find((t) => t.id === link.src)
  if (!parentTask) throw Error('FUNCTIONS:GET_UPPER_SNAPSHOTS:NO_PARENT_TASK_MATCHED')
  return parentTask.actions
    .filter((actionSchema) => actionSchema.snapshot !== undefined)
    .map((as) =>
      Object.fromEntries(
        Object.entries((as as ActionSchema).snapshot).map(([key, matrix]) => [
          key,
          (as as ActionSchema).spread[key] ? matrix.slice(0, 1) : matrix
        ])
      )
    )
    .concat(getUpperSnapshots(ps, parentTask))
}

export function getPreviousSnapshots(ts: TaskSchema, as: ActionSchema): Array<ActionInterfaceSuperset['returnType']> {
  const previousActionSchemas = ts.actions.slice(
    0,
    ts.actions.findIndex((actionSchema) => actionSchema === as)
  )

  /**
   * spreading is not applied
   * because It's before stamping
   */
  return previousActionSchemas
    .map((actionSchema) => actionSchema.snapshot)
    .filter((snapshot): snapshot is DataRecord => snapshot !== undefined)
}

export function stringifyData(matrix: Array<Array<string>>) {
  return matrix.map((row) => `[${row.join(',')}]`).join('\n')
}

export function shortenSnapshot(dr: DataRecord) {
  return Object.fromEntries(
    Object.entries(dr).map(([substitute, data]) => [
      substitute,
      data.slice(0, SNAPSHOT_MAX_ROW_LENGTH).map((row) => row.slice(0, SNAPSHOT_MAX_COL_LENGTH))
    ])
  )
}

export function getSubstitutesOn(ps: ProcedureSchema) {
  return Object.keys(ps.idr)
    .concat(Object.keys(ps.$cdr))
    .concat(
      ps.tasks
        .flat()
        .flatMap((ts) => ts.actions)
        .flatMap((as) => Object.keys(as.snapshot))
    )
}
