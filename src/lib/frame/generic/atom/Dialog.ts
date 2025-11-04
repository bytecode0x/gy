import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const Dialog = styled.dialog<GenericAtomFrameProps>`
  text-decoration: none;
  padding: 1rem;
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0;

  // not working don't know why
  // &:not(::backdrop) {
  //   display: none !important;
  // }

  &:not([open]) {
    display: none !important;
  }

  ${({ css }) => kebabizeCSSObject(css)}
`
