import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

type Props = GenericAtomFrameProps

export const Input = styled.input<Props>`
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  background-color: transparent;
  border-width: 0;
  &:focus {
    outline-width: 0;
  }

  ${({ css }) => kebabizeCSSObject(css)}

  &::placeholder {
    color: grey;
  }
`

export default Input
