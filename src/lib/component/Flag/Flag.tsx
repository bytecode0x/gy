import { Div, FlexCenterDiv } from 'lib/frame/generic'
import { FC, memo, useEffect, useState } from 'react'
import { SetFlag } from 'sementic_events'
import styled from 'styled-components'

const Container = styled(FlexCenterDiv)`
  & + & {
    margin-left: 4px;
  }
`

const Status = styled(Div)<{ status: boolean | undefined }>`
  border-radius: 100%;
  width: 6px;
  height: 6px;
  opacity: 0.8;
  background-color: ${({ status }) => (status === undefined ? 'grey' : status ? 'green' : 'red')};
`

type FlagProps = {
  id: string
  onMessage: string
  offMessage: string
}

const Flag: FC<FlagProps> = ({ id, onMessage, offMessage }) => {
  const [status, setStatus] = useState<boolean | undefined>(undefined)

  useEffect(function () {
    window.eh.onEvent<SetFlag>('SET_FLAG', async function ({ payload: { id: $id, value } }) {
      // make time for others to respond
      if ($id !== id) await new Promise((resolve) => setTimeout(resolve, 1000))

      return setStatus(value)
    })

    return function () {
      window.eh.removeAllEventListenerOn<SetFlag>('SET_FLAG')
    }
  }, [])

  return (
    <Container title={id}>
      <Status data-desc={status ? onMessage : offMessage} status={status} />
    </Container>
  )
}

export default memo(Flag)
