import ThreeDotLoader from 'lib/asset/svg/ThreeDotLoader'
import User from 'lib/asset/svg/User'
import { GetCertificate } from 'lib/event/sementic'
import { FlexCenterDiv, Span, SVGSpanButton } from 'lib/frame/generic'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { __Local__Certificate } from 'type/app'

const Container = styled(SVGSpanButton)`
  border-radius: 16px;
  background-color: var(--color-light-grey2);
  align-items: center;
  padding: 4px;
  margin-left: 8px;

  & > svg:first-child {
    margin-right: 4px;
  }
`

const StateContainer = styled(FlexCenterDiv)`
  width: 40px;
  padding: 2px;
`

const State = styled(Span)`
  font-size: 10px;
  white-space: nowrap;
`

const AuthState = () => {
  const [certificate, setCertificate] = useState<__Local__Certificate | null | undefined>(null)

  useEffect(function () {
    if (process.env.NODE_ENV === 'devserver') return
    const evHandler = getEvHandler()

    evHandler
      .sendEvent<GetCertificate>({
        name: 'GET_CERTIFICATE',
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })
      .then((cert) => setCertificate(cert))
  }, [])

  return (
    <Container>
      <User />
      <StateContainer>{certificate ? <State>인증됨</State> : <ThreeDotLoader />}</StateContainer>
    </Container>
  )
}

export default React.memo(AuthState)
