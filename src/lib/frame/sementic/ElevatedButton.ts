import styled from 'styled-components'
import { SVGButton } from '../generic'

export const ElevatedButton = styled(SVGButton)<{ selected?: boolean }>`
  background-color: var(--color-light-grey2);
  box-shadow: inset 1px 1px 2px 1px var(--color-border-base);
  border: ${(state) => (state.selected ? '1px solid black' : 'none')};

  & > svg {
    width: 20px;
    height: 20px;
  }
`
