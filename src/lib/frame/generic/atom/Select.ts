import styled from 'styled-components'

export const Select = styled.select`
  // color: inherit;
  // background-color: transparent;
  // border-width: 0;
  &:focus {
    outline-width: 0;
  }

  /* option doesn't inherit from parents */
  // & option {
  //   background-color: var(--color-bg-primary);
  //   color: var(--color-text-primary);
  // }
`
export default Select
