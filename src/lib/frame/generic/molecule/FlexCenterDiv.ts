import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { Div } from '../atom'

export const FlexCenterDiv = styled(Div)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  ${({ css }) => kebabizeCSSObject(css)}
`

export default FlexCenterDiv
