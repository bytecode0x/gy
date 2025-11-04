import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const Abbr = styled.abbr<GenericAtomFrameProps>`
  text-decoration: none;
  ${({ css }) => kebabizeCSSObject(css)}
`
