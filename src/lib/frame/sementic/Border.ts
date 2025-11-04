import styled from 'styled-components'
import { FlexColumnDiv } from '../generic'

export const Border = styled(FlexColumnDiv)`
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  min-height: 0;
  min-width: 0;
`
