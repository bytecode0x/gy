import { ActionInterfaceSuperset, ActionSchema } from 'lib/gy/core/type/action'

export type ActionInput<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> = {
  help: string
  template: TActionInterface['template']
  /**
   * TODO
   * change design to return ReactNode
   * and change action through side-effect and state
   * this can handle continuous input from user
   * design and specify both should take action as input
   * so that change of the current action should invoke re-render builder to Design and Specification through property
   */
  // design: (render?: (component: ReactNode) => void, option?: T['option']) => Promise<T['value']> | T['value']
  design: React.FC<{ as: ActionSchema<TActionInterface> }>
  // specify: (value: T['value']) => Promise<T['spec']> | T['spec']
  specify: React.FC<{ as: ActionSchema<TActionInterface> }>
  // specify: Record<string, string>
  effect?: (as: ActionSchema<TActionInterface>) => any
  onActionLabelChange?: (as: ActionSchema<TActionInterface>, prevName: string) => any
}
