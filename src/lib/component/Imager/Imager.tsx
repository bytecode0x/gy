import * as fabric from 'fabric'
import { Button, Canvas, FlexCenterDiv, FlexColumnDiv, FlexDiv, TextButton } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

type ImagerProps = {
  width: number
  height: number
  imageUrls: Array<{ url: string; id: string }>
  onExport: (exports: Array<{ url: string; id: string }>) => any
}

const Imager: React.FunctionComponent<ImagerProps> = ({ width, height, imageUrls, onExport }) => {
  const [exports, setExports] = useState<Array<{ url: string; id: string }>>([])
  const container = useRef<HTMLDivElement>(null)

  useEffect(function log() {
    console.log('state: ', state)

    Object.assign(window, { state, fabric })
  })

  const state: {
    canvas: fabric.Canvas | undefined
    select: fabric.FabricObject | undefined
    imageIdsInCurrentCanvas: Set<string>
  } = {
    canvas: undefined,
    select: undefined,
    imageIdsInCurrentCanvas: new Set()
  }

  return (
    <Container ref={container}>
      <Left>
        <ImagesContainer>
          {imageUrls.map(({ url }, i) => (
            <ImageButton
              key={i}
              onClick={async function () {
                if (!state.canvas) return
                const t = await fabric.FabricImage.fromURL(url)

                state.canvas.add(t)
              }}
            >
              <img src={url} alt='failed to load' />
            </ImageButton>
          ))}
        </ImagesContainer>
        <ImagesContainer>
          {exports.map(({ url }, i) => (
            <ImageButton
              key={i}
              onClick={async function () {
                if (!state.canvas) return
                const t = await fabric.FabricImage.fromURL(url)

                state.canvas.add(t)
              }}
            >
              <img src={url} alt='failed to load' />
            </ImageButton>
          ))}
        </ImagesContainer>
      </Left>
      <Center>
        <UtilityButtonsContainer>
          <TextButton
            onClick={function () {
              if (!state.canvas) return

              state.canvas.clear()
            }}
          >
            Clear
          </TextButton>
          <TextButton
            onClick={function () {
              if (!state.canvas) return

              const id =
                window.prompt('image id: ', Array.from(state.imageIdsInCurrentCanvas).join('_')) ||
                Array.from(state.imageIdsInCurrentCanvas).join('_') ||
                Date.now().toString()

              setExports((prev) =>
                prev.concat([{ id, url: state.canvas!.toDataURL({ format: 'png', multiplier: 1 }) }])
              )
            }}
          >
            Save
          </TextButton>
          <TextButton
            onClick={function () {
              if (!state.canvas) return

              // const ctx = state.canvas.getContext('2d')

              onExport(exports)
            }}
          >
            Export
          </TextButton>
          <TargetButton
            // disabled
            onClick={function () {
              console.log('removing selection')
              if (!state.canvas || !state.select) return console.log('failed to remove')

              // const select = state.canvas.getActiveObject()

              // if (!select) return

              state.canvas.remove(state.select)
            }}
          >
            Delete
          </TargetButton>
          <TargetButton
            // disabled
            onClick={function () {
              if (!state.canvas || !state.select) return

              state.canvas.bringObjectForward(state.select)
            }}
          >
            Up
          </TargetButton>
          <TargetButton
            // disabled
            onClick={function () {
              if (!state.canvas || !state.select) return

              state.canvas.sendObjectBackwards(state.select)
            }}
          >
            Down
          </TargetButton>
          <TargetButton
            onClick={function () {
              if (!state.select || !state.canvas) return

              state.canvas.discardActiveObject()
              state.canvas.renderAll()
            }}
          >
            Discard Select
          </TargetButton>
          <TextButton>Crop</TextButton>
          <TargetButton
            // disabled
            onClick={function () {
              if (!state.canvas || !state.select || state.select.type !== 'image') return

              const { width, height } = state.select.getBoundingRect()

              // state.canvas.setWidth(width)
              // state.canvas.setHeight(height)

              // need to relocate at top-left
              state.select

              state.canvas.setDimensions({ width, height })
              state.select.set({
                left: 0,
                top: 0,
                originX: 'left',
                originY: 'top'
              })
              state.select.setCoords()
            }}
          >
            Tighten
          </TargetButton>
        </UtilityButtonsContainer>
        <CanvasContainer
          width={width}
          height={height}
          ref={function (container) {
            if (!container) return

            const threshold = 200
            let timeout: any

            const observer = new ResizeObserver(function (entries) {
              clearTimeout(timeout)
              const { width, height } = entries[0].contentRect

              timeout = setTimeout(function () {
                if (!state.canvas) return
                state.canvas.setDimensions({ width: Math.max(width - 20, 0), height: Math.max(height - 20, 0) })
              }, threshold)
            })

            observer.observe(container)
          }}
          // onClickCapture={function (e) {
          //   console.log('container click capture, discarding selection')
          // }}
        >
          <Canvas
            ref={function (c) {
              if (!c) return

              state.canvas = new fabric.Canvas(c)

              // state.canvas.getElement().onclick = (e) => e.stopPropagation()

              state.canvas.on('selection:created', function (e) {
                state.select = e.selected.at(0)
                console.log('selection: ', state.select)
                console.log('selection size: ', state.select?.getBoundingRect())
                container.current!.querySelectorAll(`${TargetButton}`).forEach(function (b) {
                  ;(b as HTMLButtonElement).style.cursor = 'pointer'
                })
              })

              state.canvas.on('selection:cleared', function (e) {
                console.log('selection cleared')
                container.current!.querySelectorAll(`${TargetButton}`).forEach(function (b) {
                  ;(b as HTMLButtonElement).style.cursor = 'no-drop'
                })
              })
            }}
          />
        </CanvasContainer>
      </Center>
    </Container>
  )
}

const Container = styled(FlexDiv)`
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
`

const Left = styled(FlexColumnDiv)`
  width: 80px;
  border-right: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: 4px;
`

const Center = styled(FlexColumnDiv)`
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 4px;
`

const CanvasContainer = styled(FlexCenterDiv)<{ width: number; height: number }>`
  resize: both;
  overflow: auto;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
`

const ImagesContainer = styled(FlexColumnDiv)`
  flex: 1;
  min-width: 0;
  min-height: 0;
  align-items: center;
  margin-left: 4px;
  overflow: scroll;
  ${SCROLL}

  & img {
    object-fit: contain;
    width: 90%;
  }
`

const ImageButton = styled(Button)``

const UtilityButtonsContainer = styled(FlexDiv)``

const TargetButton = styled(TextButton)`
  cursor: no-drop;
`

export default Imager
