export type Event<
  TName extends string = string,
  TSender extends string = string,
  TReceiver extends string = string,
  TPayload = undefined,
  TReturn = void
  // TMeta = undefined
> = {
  name: TName
  sender: TSender
  receiver: TReceiver
  payload: TPayload
  returnType: TReturn
}

export type EventMatrix<
  TName extends string = string,
  TSender extends string = string,
  TReceiver extends string = string,
  TPayload = undefined,
  TReturn = void
> = {
  [S in TSender]: { [T in TReceiver]: Event<TName, S, T, TPayload, TReturn> }
}[TSender][TReceiver]

export type SuperEvent<TSender extends string = string, TReceiver extends string = string> = Event<
  string,
  TSender,
  TReceiver,
  any,
  any
>

export type SuperEventMatrix<TSender extends string = string, TReceiver extends string = string> = EventMatrix<
  string,
  TSender,
  TReceiver,
  any,
  any
>
