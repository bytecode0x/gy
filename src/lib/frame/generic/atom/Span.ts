import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { HOVER_DESCRIPTION } from '../../../styled-css-property'
import { GenericAtomFrameProps } from '../../type'

export const Span = styled.span<GenericAtomFrameProps>`
  color: inherit;
  white-space: pre-line;
  font-size: inherit;
  font-family: inherit;
  word-break: break-all;

  ${({ css }) => kebabizeCSSObject(css)}
  ${HOVER_DESCRIPTION}
`

export default Span
