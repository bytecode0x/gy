import ImageEditor from 'lib/component/ImageEditor'
import Prompt from 'lib/component/Prompt'
import RawStringInput from 'lib/component/RawStringInput'
import Select from 'lib/component/Select'
import 'lib/css/global.css'
import { FlexColumnDiv } from 'lib/frame/generic'
import { useEffect, useState } from 'react'
import { CloseWindow, Dialog, Fulfill, RendererReady } from 'sementic_events'
import styled from 'styled-components'
import './dialog.css'

const Container = styled(FlexColumnDiv)`
  // -webkit-app-region: drag;
  width: 100%;
  height: 100%;

  & > *:first-child {
    width: 100%;
    height: 100%;
  }
`

const DialogApp = () => {
  const [dialog, setDialog] = useState<Dialog['payload']>()

  useEffect(function fetch() {
    window.eh
      .sendEvent<RendererReady<Dialog['payload']>>({
        name: 'RENDERER_READY',
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
        payload: window.eh.id as number
      })
      .then(function (dialogOptions) {
        // console.log('reply: ', dialogOptions)
        setDialog(dialogOptions)
      })
  }, [])

  useEffect(
    function log() {
      console.log('dialog parameter: ', dialog)
    },
    [dialog]
  )

  return (
    <Container>
      {(function () {
        if (!dialog) return <></>

        switch (dialog?.type) {
          case 'prompt': {
            return (
              <Prompt
                {...dialog}
                // placeholder='값을 입력하세요 대체(Substitution)는 적용되지 않습니다'
                onResolve={function (input) {
                  return window.eh.sendEvent<Fulfill<Extract<Dialog, { payload: { type: 'prompt' } }>['returnType']>>({
                    name: 'FULFILL',
                    payload: { channel: `dialog_${window.eh.id}`, value: { value: input } },
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
                onReject={function (reason) {
                  return window.eh.sendEvent<CloseWindow>({
                    name: 'CLOSE_WINDOW',
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
              />
            )
          }
          case 'select': {
            return (
              <Select
                {...dialog}
                onResolve={function (chosens, indices) {
                  return window.eh.sendEvent<Fulfill<Extract<Dialog, { payload: { type: 'select' } }>['returnType']>>({
                    name: 'FULFILL',
                    payload: { channel: `dialog_${window.eh.id}`, value: { chosens, indices } },
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
                onReject={function (reason) {
                  return window.eh.sendEvent<CloseWindow>({
                    name: 'CLOSE_WINDOW',
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
              />
            )
          }

          case 'form': {
            return (
              <RawStringInput
                header={dialog.header}
                initial={dialog.record}
                interpret={
                  dialog.scopeKey
                    ? ($record) =>
                        window.eh.sendEvent({
                          name: dialog.scopeKey!,
                          payload: $record,
                          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                        })
                    : undefined
                }
                onReject={function (reason) {
                  return window.eh.sendEvent<CloseWindow>({
                    name: 'CLOSE_WINDOW',
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
                onResolve={function (record, interpreted) {
                  return window.eh.sendEvent<Fulfill<Extract<Dialog, { payload: { type: 'form' } }>['returnType']>>({
                    name: 'FULFILL',
                    payload: {
                      channel: `dialog_${window.eh.id}`,
                      value: { record }
                    },
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
              />
            )
          }

          case 'image-editor': {
            return (
              <ImageEditor
                header={dialog.header}
                imageUrls={dialog.imageUrls}
                imageIds={dialog.imageIds}
                serializeOnly={dialog.serializeOnly}
                onReject={function (reason) {
                  return window.eh.sendEvent<CloseWindow>({
                    name: 'CLOSE_WINDOW',
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
                onResolve={function (dataUrls, ids) {
                  return window.eh.sendEvent<
                    Fulfill<Extract<Dialog, { payload: { type: 'image-editor' } }>['returnType']>
                  >({
                    name: 'FULFILL',
                    payload: {
                      channel: `dialog_${window.eh.id}`,
                      value: { exports: dataUrls, ids }
                    },
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                }}
              />
            )
          }

          default:
            return <></>
        }
      })()}
    </Container>
  )
}

export default DialogApp
