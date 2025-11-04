import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { FLEX_CENTER } from '../../../styled-css-property'
import { Button } from '../atom'

export const FlexButton = styled(Button)`
  ${FLEX_CENTER}
  ${({ css }) => kebabizeCSSObject(css)}
`

export default FlexButton
