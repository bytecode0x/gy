import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { HOVER_DESCRIPTION } from '../../../styled-css-property'
import { GenericAtomFrameProps } from '../../type'

export const Label = styled.label<GenericAtomFrameProps>`
  color: inherit;

  ${HOVER_DESCRIPTION}
  ${({ css }) => kebabizeCSSObject(css)}
`

export default Label
