import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'
import TableBody from './TableBody'
import TableHead from './TableHead'

export const Table = styled.table<GenericAtomFrameProps>`
  border: 1px solid;
  border-spacing: 0;
  border-collapse: collapse;

  ${TableBody}: last-child, ${TableHead}: last-child {
    border-right-width: 0;
  }

  ${({ css }) => kebabizeCSSObject(css)}
`

export default Table
