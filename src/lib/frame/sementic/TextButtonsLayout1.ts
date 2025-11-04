import styled from 'styled-components'
import { FlexDiv } from '../generic'

export const TextButtonsLayout1 = styled(FlexDiv)`
  justify-content: space-between;
  font-size: 12px;
  & button {
    border: 1px soid var(--color-border-base, rgba(0, 0, 0, 0.1));
    padding: 6px;
    margin-right: 4px;
    box-shadow: var(--shadow-elevation, 0 1px 2px rgba(0, 0, 0, 0.15));
    white-space: nowrap;
  }
`
