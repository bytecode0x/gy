import { SCROLL } from 'lib/styled-css-property'
import styled from 'styled-components'
import { FlexColumnDiv } from '../generic'

export const TextAreaLayout1 = styled(FlexColumnDiv)`
  flex: 1;
  padding: 4px;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));

  & > textarea {
    flex: 1;
    outline: none;
    border: none;
    margin: 0 8px;
    text-align: start;
    ${SCROLL}
  }
`
