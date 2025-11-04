import { CSSProperties } from 'react'
import { StyledComponent } from 'styled-components'

export type SCProps<T> = T extends StyledComponent<any, infer P> ? P : never

/**
 * why not take all the css properties in this property?
 * => need default value
 */
export type GenericAtomFrameProps = {
  css?: CSSProperties
}