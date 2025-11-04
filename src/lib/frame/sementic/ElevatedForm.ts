import styled from 'styled-components'
import { Form } from '../generic'

export const ElevatedForm = styled(Form)`
  box-shadow: var(--shadow-elevation4, 0px 2px 4px rgba(0, 0, 0, 0.6));
  border-radius: var(--border-radius-default, 8px);
  padding: var(--padding-default, 8px);
  display: flex;
  flex-direction: column;
  background-color: white;
  font-size: 12px;
  min-height: 0;
`
