import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { GenericAtomFrameProps } from '../../type'

export const TableData = styled.td<GenericAtomFrameProps>`
  border-right: 1px solid;
  padding: 5px 10px;

  &: last-child {
    border-right-width: 0;
  }

  ${({ css }) => kebabizeCSSObject(css)}
`

export default TableData
