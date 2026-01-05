import { v4 } from 'uuid'
import { NoReply } from '../error/NoReply'
import { EventMatrix } from '../interface/event'
import { ReceivingMessageMatrix, SendingMessage, SuperCoreLayerMessage, SuperReceivingMessage } from '../interface/message'
import CustomEvent from './CustomEvent'
import { EventInterface } from './EventInferface'

export type EventHandlerJSOptions<
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

export class EventHandlerJS<
  TComponentUnion extends string,
  TComponent extends TComponentUnion,
  TAliasUnion extends string,
  TAlias extends TAliasUnion,
  // TSendingMeta extends { [TReceiver in TComponentUnion]: { [p: string]: any } },
  TReceivingMeta extends Partial<{ [TSender in TComponentUnion]: { [p: string]: any } }>
> extends EventTarget {
  alias?: TAlias

  component: TComponent

  book: Partial<{ [K in TAliasUnion]: { component: TComponentUnion; id: string | number } }>

  id: string | number

  _cbTable: Record<string, Array<EventListenerOrEventListenerObject>>

  interfaceTable: Partial<{
    [TReceiver in TComponentUnion]: EventInterface<TComponent, TReceiver, TReceivingMeta>
  }>

  nextHopTable: { [key in TComponentUnion]: TComponentUnion }

  fulfillHandle: Record<string, Array<(value: any | PromiseLike<any>) => void>>

  denyHandle: Record<string, Array<(reason?: Error) => void>>

  constructor({
    alias,
    component,
    id,
    interfaceTable,
    nextHopTable
  }: EventHandlerJSOptions<TComponentUnion, TComponent, TAliasUnion, TAlias, TReceivingMeta>) {
    super()

    this.alias = alias
    this.id = id
    this.component = component
    this.interfaceTable = interfaceTable
    this.nextHopTable = nextHopTable
    this.book = {}
    this._cbTable = {}
    this.fulfillHandle = {}
    this.denyHandle = {}
    if (this.alias) Object.assign(this.book, { [this.alias]: { component: this.component, id: this.id } })
    /**
     * first you get events through event type 'event'
     * and you validate the target on the data
     * then you make new event with actual message name and dispatch it to invoke callbacks
     *
     * if you validate event name inside callbacks It will cost so much resources
     * because all the callbacks should invoke to check whether the event is for themselves or not
     */
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

  /**
   * append sender and transform into corelayer message
   */
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

  async signal<TMessage extends SuperCoreLayerMessage<TReceivingMeta[TComponentUnion] & {}>>(message: TMessage) {
    // console.log(message, this.id)
    if (
      ('alias' in message.meta.receiver && message.meta.receiver.alias === this.alias) ||
      ('id' in message.meta.receiver && message.meta.receiver.id === this.id)
    )
      return this.dispatchEvent(new CustomEvent({ message }))

    // console.log('signal message : ', message)

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
      Extract<
        TEvent,
        { [TReceiver in TReceiverUnion]: { sender: TComponentUnion; receiver: TReceiver } }[TReceiverUnion]
      >
    >
  ): TEvent['returnType'] {
    const receiverComponent = message.meta.receiver.component
    const nextHop = this.nextHopTable[receiverComponent]

    const itf = this.interfaceTable[nextHop]
    if (!itf) throw new Error(`NO_INTERFACE::${message.name}::${this.component}=>${receiverComponent}`)
    if (!itf.egressSync)
      throw new Error(`synchrounous sending is not available from ${this.component} to ${receiverComponent}`)

    Object.assign(message.meta, { synchronous: true })
    const packed = this._pack(message)
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
      Extract<
        TEvent,
        { [TReceiver in TReceiverUnion]: { sender: TComponentUnion; receiver: TReceiver } }[TReceiverUnion]
      >
    >
  ): Promise<TEvent['returnType']> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<TEvent['returnType']>(async (resolve, reject) => {
      const receiverComponent = message.meta.receiver.component
      const nextHop = this.nextHopTable[receiverComponent]

      const itf = this.interfaceTable[nextHop]
      if (!itf) return reject(new Error(`NO_INTERFACE::${message.name}::${this.component}=>${receiverComponent}`))

      const packet = this._pack(message)

      function onReply(response: any) {
        const { message } = response as CustomEvent
        if (message.meta.err) return reject(new Error(message.meta.err))
        return resolve(message.payload)
      }

      this.addEventListener(packet.meta.msgId, onReply, { once: true })

      try {
        // @ts-ignore
        await itf.egress(packet)
      } catch (err: any) {
        this.removeEventListener(packet.meta.msgId, onReply)
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
    TSenderUnion extends TEvent['sender'] = TEvent['sender']
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
    const wrapper: Parameters<typeof this.addEventListener>['1'] = async (customEvent) => {
      const { message } = customEvent as CustomEvent

      // console.log('onEvent corelayer message : ', message)

      let returnValue: TEvent['returnType'] | undefined
      let err: string | undefined
      try {
        // @ts-ignore
        returnValue = await cb(message)
        err = undefined
      } catch (_: any) {
        if (_ instanceof NoReply || _.name === 'no_reply') return Promise.resolve()
        // console.error(_err)
        err = `${_.toString()}\n${_.stack}` || `error`
      }

      const receiverComponent = message.meta.sender.component as TComponentUnion
      const nextHop = this.nextHopTable[receiverComponent]

      const itf = this.interfaceTable[nextHop]
      if (!itf) throw new Error(`NO_INTERFACE::${message.name}::${this.component}=>${nextHop}`)

      return itf.egress({
        name: message.meta.msgId,
        payload: returnValue,
        // later
        // @ts-ignore
        meta: {
          msgId: '',
          err: err ? `${message.name}:${err}` : undefined,
          sender: { component: this.component, alias: this.alias, id: this.id },
          receiver: message.meta.sender,
          synchronous: message.meta.synchronous
        }
        // native: message.native
      })
    }

    this.addEventListener(name, wrapper, { once: options?.once })
    if (this._cbTable[name]) this._cbTable[name].push(wrapper)
    else this._cbTable[name] = [wrapper]

    return () => {
      this.removeEventListener(name, wrapper)
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

  /**
   * todo callback table
   */
  removeAllEventListenerOn<TEvent extends EventMatrix<string, TComponentUnion, TComponentUnion, any, any>>(
    name: TEvent['name']
  ) {
    this._cbTable[name]?.forEach((cb) => this.removeEventListener(name, cb))
    delete this._cbTable[name]
  }
}
