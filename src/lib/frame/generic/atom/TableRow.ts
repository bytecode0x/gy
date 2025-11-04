import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const TableRow = styled.tr<GenericAtomFrameProps>`
  border-bottom: 1px solid;
  ${({ css }) => kebabizeCSSObject(css)}
`

export default TableRow
