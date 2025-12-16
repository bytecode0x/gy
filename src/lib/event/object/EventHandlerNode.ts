import { EventEmitter } from 'events'
import { v4 } from 'uuid'
import { NoReply } from '../error/NoReply'
import { EventMatrix } from '../type/event'
import { ReceivingMessageMatrix, SendingMessage, SuperCoreLayerMessage, SuperReceivingMessage } from '../type/message'
import { EventInterface } from './EventInferface'

export type EventHandlerNodeOptions<
  TComponentUnion extends string,
  TComponent extends TComponentUnion,
  TAliasUnion extends string,
  TAlias extends TAliasUnion,
  TReceivingMeta extends Partial<{ [TSender in TComponentUnion]: { [p: string]: any } }>
> = {
  alias?: TAlias
  id: string | number
  component: TComponent
  interfaceTable: Partial<{
    [TReceiver in TComponentUnion]: EventInterface<TComponent, TReceiver, TReceivingMeta>
  }>
  nextHopTable: { [T in TComponentUnion]: TComponentUnion }
}

export class EventHandlerNode<
  TComponentUnion extends string,
  TComponent extends TComponentUnion,
  TAliasUnion extends string,
  TAlias extends TAliasUnion,
  // TSendingMeta extends { [TReceiver in TComponentUnion]: { [p: string]: any } },
  TReceivingMeta extends Partial<{ [TSender in TComponentUnion]: { [p: string]: any } }>
> extends EventEmitter {
  alias?: TAlias

  component: TComponent

  book: Partial<{ [K in TAliasUnion]: { component: TComponentUnion; id: string | number } }>

  id: string | number

  interfaceTable: Partial<{
    [TReceiver in TComponentUnion]: EventInterface<TComponent, TReceiver, TReceivingMeta>
  }>

  nextHopTable: { [T in TComponentUnion]: TComponentUnion }

  fulfillHandle: Record<string, Array<(value: any | PromiseLike<any>) => void>>

  denyHandle: Record<string, Array<(reason?: Error) => void>>

  constructor({
    id,
    alias,
    component,
    interfaceTable,
    nextHopTable
  }: EventHandlerNodeOptions<TComponentUnion, TComponent, TAliasUnion, TAlias, TReceivingMeta>) {
    super()
    this.alias = alias
    this.id = id
    this.component = component
    this.interfaceTable = interfaceTable
    this.nextHopTable = nextHopTable
    this.book = {}
    this.fulfillHandle = {}
    this.denyHandle = {}
    if (this.alias) Object.assign(this.book, { [this.alias]: { component: this.component, id: this.id } })
  }

  // eslint-disable-next-line class-methods-use-this
  _unpack(coreLayerMessage: SuperCoreLayerMessage): SuperReceivingMessage {
    return {
      name: coreLayerMessage.name,
      payload: coreLayerMessage.payload,
      meta: {
        ...coreLayerMessage.meta
      }
    }
  }

  _pack(sendingMessage: SendingMessage): SuperCoreLayerMessage {
    const msgId = v4()

    return {
      name: sendingMessage.name,
      payload: 'payload' in sendingMessage ? sendingMessage.payload : undefined,
      meta: {
        ...sendingMessage.meta,
        msgId,
        sender: { component: this.component, id: this.id, alias: this.alias }
      }
    }
  }

  _getId(target: TAliasUnion) {
    const instance = this.book[target]

    if (!instance) throw new Error(`_GET_ID::INVALID_TARGET_${target}`)

    return instance.id
  }

  addInterface<TReceiverUnion extends TComponentUnion = TComponentUnion>(
    name: TReceiverUnion,
    evInterface: { [TReceiver in TReceiverUnion]: EventInterface<TComponent, TReceiver> }[TReceiverUnion]
    /**
     * types below invoke type error
     * this is so funny
     */
    // evInterface: { [TReceiver in Component]: EventInterface<TComponentUnion, TReceiver> }[Component]
    // evInterface: { [TReceiver in Component]: EventInterface<TComponentUnion, TReceiver> }[TReceiver]
    // evInterface: { [TReceiver in TReceiverUnion]: EventInterface<TComponentUnion, TReceiver> }[Component]
  ) {
    this.interfaceTable[name] = evInterface
  }

  removeInterface(name: TComponentUnion) {
    delete this.interfaceTable[name]
  }

  /**
   * you must bind this function to the instance before assign it to event interfaces
   */
  async signal<TMessage extends SuperCoreLayerMessage<TReceivingMeta[TComponentUnion] & {}>>(message: TMessage) {
    if (
      ('alias' in message.meta.receiver && message.meta.receiver.alias === this.alias) ||
      ('id' in message.meta.receiver && message.meta.receiver.id === this.id)
    )
      return this.emit(message.name, message)

    const receiverComponent = message.meta.receiver.component as TComponentUnion

    const nextHop = this.nextHopTable[receiverComponent]

    const messageInterface = this.interfaceTable[nextHop]

    try {
      if (!messageInterface) throw new Error(`NO_INTERFACE_TO_${nextHop}`)
      await messageInterface.egress(message)
    } catch (err: any) {
      const senderComponent = message.meta.sender.component as TComponentUnion

      return this.interfaceTable[this.nextHopTable[senderComponent]]!.egress({
        name: message.meta.msgId,
        payload: undefined,
        // @ts-ignore
        meta: {
          msgId: '',
          err: `can't reach to ${receiverComponent}:${err?.message || 'unknown error'}`,
          sender: { component: this.component, id: this.id, alias: this.alias },
          receiver: message.meta.sender
        }
        // native: {}
      })
    }
  }

  sendEventSync<
    TEvent extends EventMatrix<string, TComponentUnion, TComponentUnion, any, any> = EventMatrix<
      string,
      TComponentUnion,
      TComponentUnion,
      any,
      any
    >,
    TReceiverUnion extends TEvent['receiver'] = TEvent['receiver']
  >(
    message: SendingMessage<
      Extract<TEvent, { [TReceiver in TReceiverUnion]: { sender: TComponent; receiver: TReceiver } }[TReceiverUnion]>
    >
  ): TEvent['returnType'] {
    const receiverComponent = message.meta.receiver.component as TReceiverUnion
    const nextHop = this.nextHopTable[receiverComponent]

    const itf = this.interfaceTable[nextHop]
    if (!itf) throw new Error(`NO_INTERFACE::${message.name}::${this.component}=>${receiverComponent}`)
    if (!itf.egressSync)
      throw new Error(`synchrounous sending is not available from ${this.component} to ${receiverComponent}`)

    const packed = this._pack(message)
    Object.assign(packed.meta, { synchronous: true })

    return itf.egressSync(packed)
  }

  sendEvent<
    TEvent extends EventMatrix<string, TComponentUnion, TComponentUnion, any, any> = EventMatrix<
      string,
      TComponentUnion,
      TComponentUnion,
      any,
      any
    >,
    TReceiverUnion extends TEvent['receiver'] = TEvent['receiver']
  >(
    message: SendingMessage<
      Extract<TEvent, { [TReceiver in TReceiverUnion]: { sender: TComponent; receiver: TReceiver } }[TReceiverUnion]>
    >
  ): Promise<TEvent['returnType']> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<TEvent['returnType']>(async (resolve, reject) => {
      const receiverComponent = message.meta.receiver.component
      const nextHop = this.nextHopTable[receiverComponent]

      const itf = this.interfaceTable[nextHop]
      if (!itf) return reject(new Error(`NO_INTERFACE::${message.name}::${this.component}=>${receiverComponent}`))

      const packet = this._pack(message)

      function onReply(response: { payload: any; meta: { err: string } }) {
        if (response.meta.err) return reject(new Error(response.meta.err))
        return resolve(response.payload)
      }

      this.once(packet.meta.msgId, onReply)

      try {
        await itf.egress(packet)
      } catch (err: any) {
        this.off(packet.meta.msgId, onReply)
        return reject(err)
      }
    })
  }

  onEvent<
    TEvent extends EventMatrix<string, TComponentUnion, TComponentUnion, any, any> = EventMatrix<
      string,
      TComponentUnion,
      TComponentUnion,
      any,
      any
    >,
    TSenderUnion extends Exclude<TEvent['sender'], TComponent> = Exclude<TEvent['sender'], TComponent>
  >(
    name: TEvent['name'],
    cb: (
      message: ReceivingMessageMatrix<
        Extract<TEvent, { [TSender in TSenderUnion]: { sender: TSender; receiver: TComponent } }[TSenderUnion]>,
        { [TSender in TSenderUnion]: TReceivingMeta[TSender] & {} }[TSenderUnion]
      >
    ) => Promise<TEvent['returnType']> | TEvent['returnType'],
    options?: { once: boolean }
  ) {
    const wrapper = async (message: SuperCoreLayerMessage) => {
      let returnValue: TEvent['returnType'] | undefined
      let err: string | undefined
      const unpacked = this._unpack(message)
      try {
        // @ts-ignore
        returnValue = await cb(unpacked)
        err = undefined
      } catch (_: any) {
        if (_ instanceof NoReply || _.name === 'no_reply') return Promise.resolve()
        console.error(_)
        err = `${_.toString()}\n${_.stack}` || `error`
      }
      const receiverComponent = message.meta.sender.component as TComponentUnion
      const nextHop = this.nextHopTable[receiverComponent]

      const itf = this.interfaceTable[nextHop]
      if (!itf) throw new Error(`NO_INTERFACE::${this.component}=>${nextHop}`)

      return itf.egress({
        name: message.meta.msgId,
        payload: returnValue,
        // later
        // @ts-ignore
        meta: {
          // ...message.meta,
          msgId: '',
          err: err ? `${message.name}:${err}` : undefined,
          sender: { component: this.component, alias: this.alias, id: this.id },
          receiver: message.meta.sender,
          synchronous: message.meta.synchronous
        }
      })
    }

    if (options?.once) this.once(name, wrapper)
    else this.on(name, wrapper)

    return () => {
      this.off(name, wrapper)
    }
  }

  /**
   * !!!!!!!!! CONSIDER !!!!!!!!!
   * expect & fulfill logic might be implemented with event instead of promise
   * but making channel overloaded can be a problem?
   */
  expect<T = any>(channel: string) {
    return new Promise<T>((resolve, reject) => {
      if (!this.fulfillHandle[channel]) this.fulfillHandle[channel] = []
      this.fulfillHandle[channel].push(resolve)

      if (!this.denyHandle[channel]) this.denyHandle[channel] = []
      this.denyHandle[channel].push(reject)
    })
  }

  fulfill(channel: string, value?: any) {
    this.fulfillHandle[channel]?.forEach((r) => r(value))

    delete this.fulfillHandle[channel]
  }

  deny(channel: string, reason?: Error) {
    this.denyHandle[channel]?.forEach((r) => r(reason))

    delete this.denyHandle[channel]
  }

  removeAllEventListenerOn<TEvent extends EventMatrix<string, TComponentUnion, TComponentUnion, any, any>>(
    name: TEvent['name']
  ) {
    this.removeAllListeners(name)
  }
}
