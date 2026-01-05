// import Finish from 'lib/assets/svg/Finish'
// import RawClose from 'lib/assets/svg/RawClose'
// import Undo from 'lib/assets/svg/Undo'

import Finish from 'lib/asset/svg/Finish'
import RawClose from 'lib/asset/svg/RawClose'
import Undo from 'lib/asset/svg/Undo'
import { CloseWindow } from 'lib/event/sementic'
import { FlexCenterDiv, FlexColumnDiv, FlexDiv } from 'lib/frame/generic'
import { ElevatedButton, ElevatedForm } from 'lib/frame/sementic'
import { getRandomColor } from 'lib/util/common'
import { createMouseCapturer } from 'local/extension/lib/function/record-mouse'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const Container = styled(FlexDiv)`
  width: 100%;
  height: 100%;
  position: relative;
`

const ButtonsContainer = styled(FlexColumnDiv)`
  position: relative;

  cursor: grab;
`

const ButtonsLayout = styled(FlexCenterDiv)`
  padding: 4px;

  & > button {
    margin: 2px 4px;
  }
`

const ScreenCapturer = () => {
  const [formContainer, setFormContainer] = useState<HTMLElement | null>(null)

  const capturer = useRef(createMouseCapturer({ color: getRandomColor() })).current

  useEffect(function init() {
    capturer.setTarget(document.body, { name: 'screen', id: '0' })

    capturer.start()

    if (!capturer.mask) return

    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '4px'
    container.style.top = '4px'
    container.style.zIndex = '2147483646'
    let x: number
    let y: number

    container.draggable = true

    container.ondragstart = function (e) {
      x = e.screenX
      y = e.screenY

      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
      // console.log('dragstart; x : ', x, 'y : ', y)
    }

    container.ondragend = function (e) {
      /**
       * calculating with clientX, clientY gives you wrong value
       */
      const dx = e.screenX - x
      const dy = e.screenY - y

      // console.log('dy : ', dy)
      // console.log('dx : ', dx)
      const rect = container.getBoundingClientRect()

      if (container.style.top) container.style.top = `${rect.top + dy}px`
      else container.style.bottom = `${rect.bottom - dy}px`

      if (container.style.left) container.style.left = `${rect.left + dx}px`
      else container.style.right = `${rect.right - dx}px`
    }
    capturer.mask.insertAdjacentElement('afterend', container)

    container.id = 'buttons-container'

    setFormContainer(container)

    return function cleanup() {
      console.log('cleanup1')
      container.ondragstart = null
      container.ondragend = null
      container.remove()
    }
  }, [])

  useEffect(function () {
    const bc = document.getElementById('buttons-container')
    if (!bc) return

    document.body.onmousedown = function (e) {
      if (!e.target || !(e.target instanceof HTMLElement)) return
      if (bc.contains(e.target)) return
      console.log(e.target)
      bc.classList.add('display-none')
    }

    document.body.onmouseup = function (e) {
      if (!e.target || !(e.target instanceof HTMLElement)) return
      if (bc.contains(e.target)) return
      bc.classList.remove('display-none')
    }

    return function cleanup() {
      console.log('cleanup2')
      document.body.onmousedown = null
      document.body.onmouseup = null
    }
  }, [])

  return (
    <Container>
      {formContainer &&
        createPortal(
          <ButtonsContainer>
            <ElevatedForm>
              <ButtonsLayout>
                <ElevatedButton
                  data-desc='확인'
                  type='button'
                  onClick={function () {
                    window.eh.fulfill(`capture_mouse_tape_${window.eh.id}`, capturer.finish())
                  }}
                >
                  <Finish />
                </ElevatedButton>

                <ElevatedButton data-desc='되돌리기' type='button' onClick={capturer.undo}>
                  <Undo />
                </ElevatedButton>

                <ElevatedButton
                  data-desc='취소'
                  type='button'
                  onClick={function () {
                    window.eh.sendEvent<CloseWindow>({
                      name: 'CLOSE_WINDOW',
                      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                    })
                  }}
                >
                  <RawClose />
                </ElevatedButton>
              </ButtonsLayout>
            </ElevatedForm>
          </ButtonsContainer>,
          formContainer
        )}
    </Container>
  )
}

export default ScreenCapturer
