import { EventMatrix, SuperEvent } from 'lib/event/interface/event'
import { SendingMessage } from 'lib/event/interface/message'
import { ComponentUnion } from 'lib/event/type'

export type GetCache = EventMatrix<'GET_CACHE', ComponentUnion, 'MAIN', undefined, Object>

export type GetCacheItem = EventMatrix<'GET_CACHE_ITEM', ComponentUnion, 'MAIN', { keySequence: Array<string> }, any>

export type SetCacheItem = EventMatrix<
  'SET_CACHE_ITEM',
  ComponentUnion,
  'MAIN',
  { keySequence: Array<string>; value: any }
>

export type Log = EventMatrix<'LOG', ComponentUnion, ComponentUnion, string>

export type Echo = EventMatrix<'ECHO', ComponentUnion, ComponentUnion, string, string>

export type Ping = EventMatrix<'PING', ComponentUnion, ComponentUnion>

export type Pipe<TEvent extends SuperEvent<ComponentUnion, ComponentUnion>> = EventMatrix<
  'PIPE',
  ComponentUnion,
  ComponentUnion,
  SendingMessage<TEvent>,
  TEvent['returnType']
>

/**
 * invoke target ComponentUnion to send a event delivered in payload
 * return true if target sent it
 */
export type Invoke<TEvent extends SuperEvent<ComponentUnion, ComponentUnion>> = EventMatrix<
  'INVOKE',
  ComponentUnion,
  ComponentUnion,
  SendingMessage<TEvent>,
  boolean
>

/**
 * basic idea is that you send event on behalf of other ComponentUnion
 * and return response to the ComponentUnion
 * contemplate it in how to implement and does it really need
 */
export type Proxy<TEvent extends SuperEvent<ComponentUnion, ComponentUnion>> = EventMatrix<
  'PROXY',
  ComponentUnion,
  ComponentUnion,
  SendingMessage<TEvent>,
  TEvent['returnType']
>

export type Fulfill<T = any> = EventMatrix<'FULFILL', ComponentUnion, ComponentUnion, { channel: string; value: T }>

// export type Expect<T = any> = EventMatrix<'EXPECT', ComponentUnion, ComponentUnion, { channel: string }, T>

export type Eval =
  | EventMatrix<
      'EVAL',
      ComponentUnion,
      Exclude<ComponentUnion, 'MAIN'>,
      { code: string; params?: Record<string, any>; meta?: { cacheKey: string } },
      any
    >
  | EventMatrix<'EVAL', ComponentUnion, 'MAIN', { code: string; params?: Record<string, any> }, any>

export type WriteFile = EventMatrix<
  'WRITE_FILE',
  ComponentUnion,
  'MAIN',
  { file: string; data: string; options?: { flag?: string } }
>
