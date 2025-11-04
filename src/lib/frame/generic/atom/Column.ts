import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const Column = styled.col<GenericAtomFrameProps>`
  ${({ css }) => kebabizeCSSObject(css)}
`

export default Column
