import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'
import TableRow from './TableRow'

export const TableBody = styled.tbody<GenericAtomFrameProps>`
  & > ${TableRow}: nth-child(even) {
    background-color: var(--color-table-row, #f7f7f7);
  }

  & > ${TableRow}: last-child {
    border-bottom-width: 0;
  }

  ${({ css }) => kebabizeCSSObject(css)}
`

export default TableBody
