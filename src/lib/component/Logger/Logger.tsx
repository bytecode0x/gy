import ArrowDown from 'lib/asset/svg/ArrowDown'
import { Log } from 'lib/event/sementic'
import { FlexColumnDiv, SVGButton } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import { getDocument } from 'local/desktop/renderer/user/function/document'
import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

const Logger = () => {
  const [logLimit, setLogLimit] = useState<number>(100)

  const scrollToBottom = useCallback(function () {
    const doc = getDocument()

    const log = doc.querySelector('#log')

    if (!log) return

    log.scrollTo(0, log.scrollHeight)
  }, [])

  useEffect(function handleLogEvent() {
    const doc = getDocument()
    const log = doc.querySelector('#log') as HTMLElement
    const scrollButton = doc.querySelector('#scroll-button')

    if (!log || !scrollButton) throw new Error('LOGGER:NO_CONTEXT')

    log.addEventListener('scroll', function () {
      if (log.scrollHeight - log.scrollTop - log.offsetHeight > 50) scrollButton.classList.add('display-flex')
      else scrollButton.classList.remove('display-flex')
    })

    window.eh.onEvent<Log>('LOG', function ({ payload: msg, meta: { sender } }) {
      console.log('log event: ', msg, sender)

      const message = document.createElement('span')
      const date = new Date()

      if (!log) return

      // const sender = e.senderId
      message.setAttribute(
        'data-time',
        `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}]`
      )
      message.setAttribute('data-sender', `(${(sender.alias || sender.component).toLowerCase()})`)

      message.innerHTML = msg

      log.appendChild(message)
      // if (log.childElementCount > logLimit) log.childNodes.forEach((child) => child.remove())
      if (log.childElementCount > logLimit) log.firstElementChild?.remove()
      if (log.scrollHeight - log.scrollTop - log.offsetHeight < 80) log.scrollTo(0, log.scrollHeight)
    })

    return function () {
      window.eh.removeAllEventListenerOn<Log>('LOG')
    }
  }, [])

  return (
    <Container>
      <MessageLayout id='log' />
      <ScrollButton id='scroll-button' onClick={scrollToBottom}>
        <ArrowDown />
      </ScrollButton>
    </Container>
  )
}

const Container = styled(FlexColumnDiv)`
  position: relative;

  align-items: stretch;
  background-color: white;

  border-radius: 4px;
  box-shadow: var(--shadow-elevation);
  padding: 0.5rem;
  // padding-right: 200px;
  font-size: 12px;
  overflow: hidden scroll;
  flex: 1;
  min-height: 0;

  ${SCROLL}

  ::-webkit-scrollbar {
    width: 6px;
    height: var(--scroll-track-size-default);
  }
  ::-webkit-scrollbar-track {
    background: var(--color-bg-primary);
    border-radius: 0 4px 4px 0;
  }
`

const MessageLayout = styled(FlexColumnDiv)`
  & > span[data-sender]::after {
    content: attr(data-sender);
    font-size: 8px;
    color: grey;
    margin: 0 4px;
  }

  & > span[data-time]::before {
    content: attr(data-time);
    font-size: 8px;
    color: grey;
    margin: 0 4px;
  }

  & > span + span {
    margin-top: 0.25rem;
  }
`

const ScrollButton = styled(SVGButton)`
  display: none;
  position: fixed;
  left: 50%;
  top: 100%;
  transform: translate(-50%, -200%);
  background-color: rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
`

export default Logger
