import { FlexDiv } from 'lib/frame/generic'
import { FC } from 'react'
import styled, { keyframes } from 'styled-components'

type Status = 'pending' | 'halted' | 'processing' | 'resolved'

type Props = { status?: Status }

const fillUp = keyframes`
  from {
    height: 100%;
  }
  to {
    height: 0%;
  }
`

const Container = styled(FlexDiv)<{ size: number; status: Status }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;

  box-shadow: var(--shadow-elevation);

  border-radius: 6px;

  background-color: ${({ status }) => (status === 'halted' ? 'red' : status === 'pending' ? 'grey' : 'green')};

  &::after {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    animation: ${fillUp} 3s ease-in-out forwards;
  }
`

const StatusBox: FC<Props> = ({ status = 'pending' }) => {
  //   const [status, setStatus] = useState<Status>(initialStatus)

  return <Container status={status} size={16} />
}

export default StatusBox
