import Cancel from 'lib/asset/svg/Cancel'
import { SVGButton } from 'lib/frame/generic'
import React, { memo, useCallback } from 'react'
import { SetVisible } from 'sementic_events'
import styled from 'styled-components'

const Container = styled(SVGButton)``

const CloseWindow = () => {
  const reqHide: React.MouseEventHandler<HTMLButtonElement> = useCallback(function (e) {
    window.eh.sendEvent<SetVisible>({
      name: 'SET_VISIBLE',
      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
      payload: false
    })
  }, [])

  return (
    <Container data-desc='창 닫기' onClick={reqHide}>
      <Cancel />
    </Container>
  )
}

export default memo(CloseWindow)
