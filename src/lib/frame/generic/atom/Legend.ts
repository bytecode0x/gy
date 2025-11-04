import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { HOVER_DESCRIPTION } from '../../../styled-css-property'
import { GenericAtomFrameProps } from '../../type'

/** faster than inline styling */

export const Legend = styled.legend<GenericAtomFrameProps>`
  // default value here
  background-color: transparent;

  // control css values in css snippets
  ${({ css }) => kebabizeCSSObject(css)}

  ${HOVER_DESCRIPTION}
`

export default Legend
