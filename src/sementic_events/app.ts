import { EventMatrix } from 'lib/event/type'
import { __Local__Certificate, ComponentUnion } from 'type'

export type GetCertificate = EventMatrix<
  'GET_CERTIFICATE',
  ComponentUnion,
  'MAIN',
  undefined,
  __Local__Certificate | null | undefined
>
