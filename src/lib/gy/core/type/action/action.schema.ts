import { DataRecord } from '../primitive'
import { ActionInterfaceSuperset, ActionInterfaceSuperset200, ActionInterfaceSuperset201 } from './action.interface'

export type ActionSchema<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> =
  ActionSchema201<TActionInterface>

export type ActionSchema200<TActionInterface extends ActionInterfaceSuperset200 = ActionInterfaceSuperset200> = {
  [K in TActionInterface['template']]: {
    id: string
    name: string
    // req: T['req']
    template: K
    /**
     * this value includes substitutes unlike ActionRecord
     */
    spread: Record<string, boolean>
    scope: Record<string, 'public' | 'intermediate' | 'private'>
    value: Extract<TActionInterface, { template: K }>['value']
    // snapshot: Extract<TActionInterface['returnType'], { template: K }>
    snapshot: DataRecord
  }
}[TActionInterface['template']]

export type ActionSchema201<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> = {
  [K in TActionInterface['template']]: {
    id: string
    name: string
    // req: T['req']
    template: K
    /**
     * this value includes substitutes unlike ActionRecord
     */
    spread: Record<string, boolean>
    scope: Record<string, 'public' | 'intermediate' | 'private'>
    value: Extract<TActionInterface, { template: K }>['schema']
    // snapshot: Extract<TActionInterface['returnType'], { template: K }>
    snapshot: DataRecord
  }
}[TActionInterface['template']]

export type InitialActionSchema<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> =
  InitialActionSchema201<TActionInterface>

export type InitialActionSchema201<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> = {
  [K in TActionInterface['template']]: {
    id: string
    name: string
    // req: T['req']
    template: K
    /**
     * this value includes substitutes unlike ActionRecord
     */
    spread: Record<string, boolean>
    scope: Record<string, 'public' | 'intermediate' | 'private'>
    value?: Extract<TActionInterface, { template: K }>['schema']
    // snapshot: Extract<TActionInterface['returnType'], { template: K }>
    snapshot: DataRecord
  }
}[TActionInterface['template']]

export type InitialActionSchema200<TActionInterface extends ActionInterfaceSuperset200 = ActionInterfaceSuperset200> = {
  [K in TActionInterface['template']]: {
    id: string
    name: string
    // req: T['req']
    template: K
    /**
     * this value includes substitutes unlike ActionRecord
     */
    spread: Record<string, boolean>
    scope: Record<string, 'public' | 'intermediate' | 'private'>
    value?: Extract<TActionInterface, { template: K }>['value']
    // snapshot: Extract<TActionInterface['returnType'], { template: K }>
    snapshot: DataRecord
  }
}[TActionInterface['template']]
