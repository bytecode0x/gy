import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { Input } from '../atom'

export const AlignedInput = styled(Input)`
  flex: 1;
  text-align: center;
  font-size: 1rem;
  ${({ css }) => kebabizeCSSObject(css)}
`

export default AlignedInput
