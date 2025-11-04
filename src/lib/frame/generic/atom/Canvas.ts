import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const Canvas = styled.canvas<GenericAtomFrameProps>`
  ${({ css }) => kebabizeCSSObject(css)}
`

export default Canvas
