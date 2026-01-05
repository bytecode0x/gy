import { SuperCoreLayerMessage } from '../interface/message'

export type CustomEventOptions<TMessage extends SuperCoreLayerMessage = SuperCoreLayerMessage> = {
  type?: string
  message: TMessage
}

// const WebAPIEvent = Object.getPrototypeOf(AnimationEvent) as typeof window.Event
// Event is overwritten in naver

export default class CustomEvent<TMessage extends SuperCoreLayerMessage = SuperCoreLayerMessage> extends Event {
  message: TMessage

  constructor({ type, message }: CustomEventOptions<TMessage>) {
    /**
     * this value assign to property 'type' which can't be changed after initialized
     */
    super(type || message.name)
    this.message = message
  }
}
