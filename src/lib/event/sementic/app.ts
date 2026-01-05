import { EventMatrix } from 'lib/event/interface'
import { ComponentUnion } from 'lib/event/type'
import { __Local__Certificate } from 'type'

export type GetCertificate = EventMatrix<
  'GET_CERTIFICATE',
  ComponentUnion,
  'MAIN',
  undefined,
  __Local__Certificate | null | undefined
>
