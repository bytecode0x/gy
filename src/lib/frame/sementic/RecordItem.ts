import styled from 'styled-components'
import { FlexCenterDiv } from '../generic'

export const RecordItem = styled(FlexCenterDiv)<{ selected?: boolean }>`
  border-radius: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding: 6px;
  position: relative;
  // background-color: var(--color-light-grey2);
  background-color: white;
  box-shadow: var(--shadow-elevation3);
  font-weight: ${(state) => (state.selected ? 'bold' : 'normal')};
  height: 30px;
`
