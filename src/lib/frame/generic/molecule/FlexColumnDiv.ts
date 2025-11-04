import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { Div } from '../atom'

export const FlexColumnDiv = styled(Div)`
  display: flex;
  flex-direction: column;
  ${({ css }) => kebabizeCSSObject(css)}
`

export default FlexColumnDiv
