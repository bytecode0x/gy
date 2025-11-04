import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { HOVER_DESCRIPTION } from '../../../styled-css-property'
import { GenericAtomFrameProps } from '../../type'

/** faster than inline styling */

export const Anchor = styled.a<GenericAtomFrameProps>`
  // default value here

  // control css values in css snippets
  ${({ css }) => kebabizeCSSObject(css)}
  ${HOVER_DESCRIPTION}
`
