import { Script } from '../script'
import { EffectConfig } from './effect.config'

export type Effect = {
  __i__scripts: Array<Array<Script['id']>>
  // scriptIds: Array<Script['id']>
  config: EffectConfig
}
