import styled from 'styled-components'
import { Dialog } from '../generic'

export const OverlayDialog = styled(Dialog)`
  width: 100vw;
  height: 100vh;

  &[open] {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`
