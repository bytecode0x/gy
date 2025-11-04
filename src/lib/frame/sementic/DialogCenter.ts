import { Dialog } from 'lib/frame/generic'
import styled from 'styled-components'

export const DialogCenter = styled(Dialog)`
  // display: flex;
  width: 100vw;
  height: 100vh;
  justify-content: center;
  align-items: center;

  &[open] {
    display: flex;
  }
`
