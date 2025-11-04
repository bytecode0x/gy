import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const Colgroup = styled.colgroup<GenericAtomFrameProps>`
  ${({ css }) => kebabizeCSSObject(css)}
`

export default Colgroup
