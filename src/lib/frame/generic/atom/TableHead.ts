import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const TableHead = styled.thead<GenericAtomFrameProps>`
  background-color: var(--color-table-head, #d7dade);
  ${({ css }) => kebabizeCSSObject(css)}
`

export default TableHead
