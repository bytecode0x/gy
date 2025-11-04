/* eslint-disable react/prop-types */
import { Button, Div, FlexCenterDiv, Form } from 'lib/frame/generic'
import { setOverlay } from 'local/extension/content-script/store'
import { useCallback } from 'react'
import styled from 'styled-components'

const Container = styled(Form)`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: var(--border-radius-default, 8px);
  padding: 16px;
  boxshadow: 'var(--shadow-elevation4)';
`

const Blinder = styled(Div)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  opacity: 0.45;
  z-index: -1;
  background-color: black;
`

const DefaultButton = styled(Button)`
  padding: 16px;
`

type OverlayFormProps = {
  onResolve: (value: any) => void
  onReject: (reason?: any) => void
  cssOnFrame?: React.CSSProperties
  defaultButton?: boolean
}

const OverlayForm: React.FC<React.PropsWithChildren<OverlayFormProps>> = ({
  onResolve,
  onReject,
  cssOnFrame,
  defaultButton,
  children
}) => {
  const clearOverlay: React.MouseEventHandler<HTMLDivElement & HTMLButtonElement & HTMLInputElement> = useCallback(
    function (e) {
      if (e.currentTarget !== e.target) return

      console.log('clear overlay')

      e.stopPropagation()
      onReject()
      setOverlay(null)
    },
    []
  )

  const resolveProduce: React.FormEventHandler<HTMLFormElement> = useCallback(function (e) {
    e.preventDefault()

    // @ts-ignore
    const formData = Object.fromEntries(new FormData(e.currentTarget).entries())

    console.log(`formData : `, formData)
    onResolve(
      Object.fromEntries(
        Object.entries(formData).map(([key, value]) =>
          /^\d+(?:\.\d+)*$/.test(value.toString()) ? [key, parseFloat(value.toString())] : [key, value.toString()]
        )
      ) as any
    )
    setOverlay(null)
  }, [])

  return (
    <Container id='ol-form' onSubmit={resolveProduce} css={cssOnFrame}>
      {/* <Blinder onClick={clearOverlay} /> */}
      {children}
      {defaultButton && (
        <FlexCenterDiv>
          <DefaultButton type='submit' form='ol-form'>
            확인
          </DefaultButton>
          <DefaultButton type='button' onClick={clearOverlay}>
            취소
          </DefaultButton>
        </FlexCenterDiv>
      )}
    </Container>
  )
}

export default OverlayForm
