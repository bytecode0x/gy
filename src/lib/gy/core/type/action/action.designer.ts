import { ActionInterfaceSuperset } from './action.interface'
import { ActionSchema } from './action.schema'

// export type ActionDesigner<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> = {
//   [K in TActionInterface['template']]: ({
//     name,
//     value,
//     scope,
//     spread,
//     edr
//   }: {
//     id?: ActionSchema<Extract<TActionInterface, { template: K }>>['id']
//     name: ActionSchema<Extract<TActionInterface, { template: K }>>['name']
//     value: ActionSchema<Extract<TActionInterface, { template: K }>>['value']
//     scope?: ActionSchema<Extract<TActionInterface, { template: K }>>['scope']
//     spread?: ActionSchema<Extract<TActionInterface, { template: K }>>['spread']
//     template: ActionSchema<Extract<TActionInterface, { template: K }>>['template']
//     snapshot: ActionSchema<Extract<TActionInterface, { template: K }>>['snapshot']

//   }) => Promise<ActionSchema<Extract<TActionInterface, { template: K }>>>
// }

export type ActionDesigner<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> = {
  [K in TActionInterface['template']]: (
    partial: Partial<ActionSchema<Extract<TActionInterface, { template: K }>>>
  ) => Promise<ActionSchema<Extract<TActionInterface, { template: K }>>>
}
