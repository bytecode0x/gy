import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { HOVER_DESCRIPTION } from '../../../styled-css-property'
import { GenericAtomFrameProps } from '../../type'

export const Button = styled.button<GenericAtomFrameProps>`
  font: inherit;
  color: inherit;
  outline: none;
  border: 0;
  background-color: transparent;
  padding: 0;
  cursor: pointer;

  ${HOVER_DESCRIPTION}

  &[disabled] {
    color: var(--color-text-primary-offset) !important;
    cursor: not-allowed;
  }
  ${({ css }) => kebabizeCSSObject(css)}
`

export default Button
