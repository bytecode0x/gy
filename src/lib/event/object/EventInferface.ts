import { SuperCoreLayerMessage } from '../type/message'

export type EventInterfaceOptions<TSender extends string, TReceiver extends string, TMeta extends {} = {}> = {
  from: TSender
  to: TReceiver
  name: string
  id: string
  secret?: string

  /**
   * this method is for only sending synch message
   */
  egressSync?(coreLayerMessage: SuperCoreLayerMessage<TMeta>): any
  /**
   * this method is for sending asynch message and replying async, sync messages
   */
  egress(coreLayerMessage: SuperCoreLayerMessage<TMeta>): Promise<void>
  // unpack(coreLayerMessage: DefaultCoreLayerMessage): DefaultReceivingMessage
  init(): void
}

export class EventInterface<TSender extends string, TReceiver extends string, TMeta extends {} = {}> {
  from: TSender

  to: TReceiver

  name: string

  id: string

  secret?: string

  egressSync?: (coreLayerMessage: SuperCoreLayerMessage) => any

  egress: (coreLayerMessage: SuperCoreLayerMessage) => Promise<void>

  // unpack: (coreLayerMessage: DefaultCoreLayerMessage) => DefaultReceivingMessage
  //   signal: <TEvent extends DefaultEvent>(message: CoreLayerMessage<TEvent>) => void

  constructor({ from, to, name, id, secret, egressSync, egress, init }: EventInterfaceOptions<TSender, TReceiver>) {
    this.from = from
    this.to = to
    this.id = id
    this.name = name
    this.secret = secret
    // this.pack = pack
    // this.unpack = unpack
    this.egressSync = egressSync
    this.egress = egress

    init()
  }

  /**
   * alert the routing engine that there are ingress data
   * this function should be given from the routing engine
   */
}
