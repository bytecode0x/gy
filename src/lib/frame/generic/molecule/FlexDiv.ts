import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { Div } from '../atom'

export const FlexDiv = styled(Div)`
  display: flex;
  ${({ css }) => kebabizeCSSObject(css)}
`

export default FlexDiv
