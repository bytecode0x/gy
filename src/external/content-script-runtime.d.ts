import { Neo } from 'lib/gy/core/instance'
import { DynamicDataRecord } from 'lib/gy/core/type/primitive'

declare global {
  const neo: Neo
  const prxy: DynamicDataRecord
}
