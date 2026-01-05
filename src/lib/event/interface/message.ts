import { SuperEvent } from './event'
import { Instance } from './instance'

export type CoreLayerMessage<TEvent extends SuperEvent = SuperEvent, TMeta extends {} = {}> = {
  name: TEvent['name']
  meta: {
    sender: { component: TEvent['sender']; id: string | number; alias?: string }
    receiver: { component: TEvent['receiver']; id: string | number; alias?: string }
    synchronous?: boolean
    msgId: string
    err?: string
    // sessionId?: string
    // secret?: string
  } & TMeta
} & (TEvent['payload'] extends undefined ? {} : { payload: TEvent['payload'] })

export type SuperCoreLayerMessage<TMeta extends {} = {}> = {
  name: string
  payload: any
  meta: {
    sender: Instance
    receiver: Instance
    synchronous?: boolean
    msgId: string
    err?: string
    // sessionId?: string
    // secret?: string
  } & TMeta
}

export type SendingMessage<TEvent extends SuperEvent = SuperEvent, TMeta extends {} = {}> = {
  name: TEvent['name']
  meta: {
    receiver: Instance<TEvent['receiver']>
  } & TMeta
} & (TEvent['payload'] extends undefined ? {} : { payload: TEvent['payload'] })

export type SendingMessageMatrix<TEvent extends SuperEvent = SuperEvent, TMeta extends {} = {}> = {
  [TReceiver in TEvent['receiver']]: {
    name: TEvent['name']
    meta: {
      receiver: Instance<TReceiver>
    } & TMeta
  } & (TEvent['payload'] extends undefined ? {} : { payload: TEvent['payload'] })
}[TEvent['receiver']]

export type SuperSendingMessage =
  | {
      name: string
      payload: any
      meta: {
        receiver: Instance
      }
    }
  | {
      name: string
      meta: {
        receiver: Instance
      }
    }

export type ReceivingMessage<TEvent extends SuperEvent = SuperEvent, TMeta extends {} = {}> = {
  name: TEvent['name']
  payload: TEvent['payload']
  meta: {
    sender: { component: TEvent['sender']; id: string | number; alias?: string }
  } & TMeta
}

export type ReceivingMessageMatrix<TEvent extends SuperEvent = SuperEvent, TMeta extends {} = {}> = {
  [TSender in TEvent['sender']]: {
    name: TEvent['name']
    payload: TEvent['payload']
    meta: {
      sender: { component: TEvent['sender']; id: string | number; alias?: string }
    } & TMeta
  }
}[TEvent['sender']]

export type SuperReceivingMessage<TMeta extends {} = {}> = {
  name: string
  payload: any
  meta: {
    sender: Instance
  } & TMeta
}
