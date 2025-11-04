import { SVGButton } from 'lib/frame/generic'
import styled from 'styled-components'

export const Frame = styled(SVGButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  padding: 16px;
  background-color: white;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.6);

  & > svg {
    width: 20px;
    height: 20px;
  }
`
