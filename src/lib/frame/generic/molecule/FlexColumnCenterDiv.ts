import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { Div } from '../atom'

type Props = {
  alignItems?: string
  justifyContent?: string
}

export const FlexColumnCenterDiv = styled(Div)<Props>`
  display: flex;
  flex-direction: column;
  align-items: ${({ alignItems }) => alignItems || 'center'};
  justify-content: ${({ justifyContent }) => justifyContent || 'center'};
  ${({ css }) => kebabizeCSSObject(css)}
`

export default FlexColumnCenterDiv
