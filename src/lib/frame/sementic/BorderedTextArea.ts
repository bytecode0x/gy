import styled from 'styled-components'
import { TextArea } from '../generic'

export const BorderedTextArea = styled(TextArea)`
  & {
    flex: 1;
    border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  }

  &::placeholder {
    font-size: 28px;
    font-style: italic;
  }
`
