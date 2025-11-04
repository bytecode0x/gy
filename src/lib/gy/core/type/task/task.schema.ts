import {
  ActionInterfaceSuperset200,
  ActionInterfaceSuperset201,
  ActionSchema200,
  ActionSchema201,
  InitialActionSchema200,
  InitialActionSchema201
} from '../action'

export type TaskSchema<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> =
  TaskSchema201<TActionInterface>

export type TaskSchema200<TActionInterface extends ActionInterfaceSuperset200 = ActionInterfaceSuperset200> =
  | {
      id: string
      name: string
      actions: Array<ActionSchema200<TActionInterface>>
      validated: true
      map: Record<string, string>
      root?: boolean
      // predication?: string
      // sharing node
      sharing?: boolean
      leaf?: boolean
      createdAt: number
    }
  | {
      id: string
      name: string
      actions: Array<InitialActionSchema200<TActionInterface>>
      validated: false | undefined
      map: Record<string, string>
      root?: boolean
      // predication?: string
      // sharing node
      sharing?: boolean
      leaf?: boolean
      createdAt: number
    }

export type TaskSchema201<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> =
  | {
      id: string
      name: string
      actions: Array<ActionSchema201<TActionInterface>>
      validated: true
      map: Record<string, string>
      root?: boolean
      // predication?: string
      // sharing node
      sharing?: boolean
      leaf?: boolean
      createdAt: number
    }
  | {
      id: string
      name: string
      actions: Array<InitialActionSchema201<TActionInterface>>
      validated: false | undefined
      map: Record<string, string>
      root?: boolean
      // predication?: string
      // sharing node
      sharing?: boolean
      leaf?: boolean
      createdAt: number
    }
