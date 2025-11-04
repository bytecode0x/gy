import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { Div } from '../atom'

export const AbsoluteNoneDiv = styled(Div)`
  display: none;
  position: absolute;
  ${({ css }) => kebabizeCSSObject(css)}
`

export default AbsoluteNoneDiv
