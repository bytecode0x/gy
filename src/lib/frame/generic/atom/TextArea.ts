import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const TextArea = styled.textarea<GenericAtomFrameProps>`
  resize: none;
  color: inherit;
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
  background-color: transparent;
  // text-align: center;
  display: inline-block;
  vertical-align: middle;

  ${({ css }) => kebabizeCSSObject(css)}

  &::placeholder {
    // transform: translateY(100%);
    text-align: center;
  }
`

export default TextArea
