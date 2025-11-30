import Logger from 'lib/component/Logger'
import Slider from 'lib/component/Slider'
import StatusBox from 'lib/component/StatusBox'
import { FlexColumnDiv, FlexDiv } from 'lib/frame/generic/molecule'
import { useEffect } from 'react'
import { Log, Pipe } from 'sementic_events'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  flex: 1;

  // flex-wrap: wrap;
  // align-content: flex-start;
`

const StatusLayout = styled(FlexDiv)`
  height: 40px;
  margin-bottom: 5px;

  & > div:nth-child(1) {
    width: 100%;
    height: 100%;
  }
`

const PseudoStatusContainer = styled(FlexDiv)`
  align-items: center;
  background: white;

  box-shadow: var(--shadow-elevation);
  padding: 4px;
  border-radius: 4px;

  & > *:not(first-child) {
    margin-left: 4px;
  }
`

const LoggerLayout = styled(FlexColumnDiv)`
  flex: 1;

  & > div:nth-child(1) {
    width: 100%;
    height: 100%;
  }
`

const RootPage = () => {
  useEffect(function () {
    console.log('root page rendered')

    window.eh.sendEvent<Pipe<Log>>({
      name: 'PIPE',
      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
      payload: {
        name: 'LOG',
        meta: { receiver: { component: 'RENDERER', alias: 'USER' } },
        payload: '<span>hello there this is from <b>main</b></span>'
      }
    })

    window.eh.sendEvent<Pipe<Log>>({
      name: 'PIPE',
      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
      payload: {
        name: 'LOG',
        meta: { receiver: { component: 'RENDERER', alias: 'USER' } },
        payload: '<span style="color: red;">this message is red</span>'
      }
    })
  }, [])

  return (
    <Container>
      <StatusLayout>
        <Slider
          width='100%'
          height='100%'
          animation
          direction='horizontal'
          circular
          control={function (reset, next) {
            Object.assign(window, { reset, next })
          }}
        >
          <PseudoStatusContainer>
            <StatusBox status='pending' />
            <StatusBox status='halted' />
            <StatusBox status='processing' />
            <StatusBox status='resolved' />
          </PseudoStatusContainer>

          <FlexDiv>2</FlexDiv>

          <FlexDiv>3</FlexDiv>
        </Slider>
      </StatusLayout>
      <LoggerLayout>
        <Logger />
      </LoggerLayout>
    </Container>
  )
}

export default RootPage
