import { Trigger } from './trigger'
import { TriggerInterfaceSuperset } from './trigger.interface'

// export type TriggerSetter<
//   TTriggerInterface extends TriggerInterfaceSuperset = TriggerInterfaceSuperset,
//   TContext extends {} = any
// > = {
//   [K in TTriggerInterface['template']]: ({
//     context,
//     action
//   }: // resources
//   {
//     context: TContext
//     action: Trigger<Extract<TTriggerInterface, { template: K }>>
//     // resources: Session['resources']
//   }) => Promise<Extract<TTriggerInterface, { template: K }>['returnType']>
// }

export type TriggerSetter<TTriggerInterface extends TriggerInterfaceSuperset = TriggerInterfaceSuperset> = {
  [Template in TTriggerInterface['template']]: (
    trigger: Trigger<Extract<TTriggerInterface, { template: Template }>>
  ) => Promise<any>
}
