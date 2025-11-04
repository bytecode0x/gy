import { Action } from '../type/action/action'
import { DataRecord } from '../type/primitive'
import { interpret } from './interpret'

export async function interpretObj(
  obj: Object,
  {
    edr
  }: {
    edr: DataRecord
  }
): Promise<Action['value']> {
  // this.infrastructures.logger?.info('_substitute start', { source: '_substitute', asValue, sdr: dr })
  if (!obj) return {}

  const entries = await Promise.all(
    Object.entries(obj).map(async function ([key, value]) {
      if (typeof value === 'string') return [key, await interpret(value, { edr })]
      else if (value instanceof Object) return [key, await interpretObj(value, { edr })]
      return [key, value]
    })
  )

  // this.infrastructures.logger?.info('_substitute end', { source: '_substitute', entries })

  /**
   * asValue is Object type but Its record can be any type
   * so if It was array, you should put it back to with sort and map
   */

  if (obj instanceof Array)
    return entries.sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10)).map(([key, value]) => value)
  return Object.fromEntries(entries)
}
