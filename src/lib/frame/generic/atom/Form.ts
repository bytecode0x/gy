import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { HOVER_DESCRIPTION } from '../../../styled-css-property'
import { GenericAtomFrameProps } from '../../type'

export const Form = styled.form<GenericAtomFrameProps>`
  background-color: transparent;

  ${({ css }) => kebabizeCSSObject(css)}

  ${HOVER_DESCRIPTION}
`

export default Form
