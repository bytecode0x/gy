import { FlexColumnDiv } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import { FC } from 'react'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  flex: 1;
  min-width: 200px;
  min-height: 0;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: 4px;
  overflow: scroll;
  ${SCROLL}
`

const Log = styled.pre`
  white-space: pre;
  font-size: 12px;
`

type LoggerProps = {
  log: string
}

const Logger: FC<LoggerProps> = ({ log }) => {
  return (
    <Container>
      <Log>{log}</Log>
    </Container>
  )
}

export default Logger
