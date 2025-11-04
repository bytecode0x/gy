import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const Datalist = styled.datalist<GenericAtomFrameProps>`
  ${({ css }) => kebabizeCSSObject(css)}
`

export default Datalist
