import { ResourceProxy } from '../../class/resource-proxy'
import { DataRecord } from '../primitive'
import { $Action } from './$action'
import { Action } from './action'
import { ActionInterfaceSuperset } from './action.interface'

export type ActionConsumerDefaultContext<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> = {
  resources: Record<string, ResourceProxy<any, string, any>>
  // task: Task<TActionInterface>
  edr: DataRecord
  sequence: Array<Action<ActionInterfaceSuperset>>
}

export type ActionConsumer<
  TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset,
  TContext extends {} = ActionConsumerDefaultContext<TActionInterface>
> = {
  [K in TActionInterface['template']]: ({
    context,
    $action,
    action,
    fallback
  }: // resources
  {
    context: TContext
    $action: $Action<Extract<TActionInterface, { template: K }>>
    action: Action<Extract<TActionInterface, { template: K }>>
    fallback?: Extract<TActionInterface, { template: K }>['fallback']
    // resources: Session['resources']
  }) => Promise<Extract<TActionInterface, { template: K }>['returnType']>
}
