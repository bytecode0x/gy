import * as fabric from 'fabric'
import { Dialog } from 'lib/event/sementic'
import { Button, Canvas, Div, FlexCenterDiv, FlexColumnDiv, FlexDiv, Input, Span, TextButton } from 'lib/frame/generic'
import { TextButtonsLayout1 } from 'lib/frame/sementic'
import { SCROLL } from 'lib/styled-css-property'
import { FC, useCallback, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'

type ImageEditorProps = {
  header: string
  width?: number
  height?: number
  imageUrls: Array<string>
  imageIds: Array<string>
  serializeOnly?: boolean
  onResolve: (dataUrls: Array<string>, ids: Array<string>) => any
  onReject: (reason?: any) => void
}

/**
 * this simulates substitution that resolves matrix
 * design value property : string
 * resolve : matrix
 *
 * todo;
 * decouple join, stringify
 */
const ImageEditor: FC<ImageEditorProps> = ({
  header,
  width,
  height,
  imageUrls,
  imageIds,
  serializeOnly,
  onResolve,
  onReject
}) => {
  // const [urls, setUrls] = useState<Array<string>>(imageUrls)
  // const [exports, setExports] = useState<Array<string>>([])
  // const [ids, setIds] = useState<Array<string>>([])

  const container = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)

  const save = useCallback(async function () {
    if (!state.canvas) return

    const { value } = (await window.eh.sendEvent<Dialog>({
      name: 'DIALOG',
      payload: {
        type: 'prompt',
        header: 'input image id',
        defaultValue: state.imageIdsInCurrentCanvas.join('_')
      },
      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
    })) as Extract<Dialog, { payload: { type: 'prompt' } }>['returnType']

    const id = value || Date.now().toString() || Array.from(state.imageIdsInCurrentCanvas).join('_')

    if (!container.current) return console.error('no container')

    const c = container.current.querySelector(`${ImagesContainer}:nth-child(2)`)

    if (!c) return

    const i = document.createElement('button')

    const img = document.createElement('img')

    const dataUrl = state.canvas.toDataURL({ format: 'png', multiplier: 1 })

    img.src = dataUrl

    i.append(img)

    i.classList.add(ImageButton.toString().slice(1), Button.toString().slice(1))

    c.append(i)

    exports.push(dataUrl)
    exportIds.push(id)

    // setExports((prev) => prev.concat([state.canvas!.toDataURL({ format: 'png', multiplier: 1 })]))
    // setIds((prev) => prev.concat([id]))
  }, [])

  const handleSerializeOnly = useCallback(
    async function () {
      if (!serializeOnly || !canvasRef.current || !state.canvas) return

      const dataUrls = []

      for (const imageUrl of imageUrls) {
        const t = await fabric.FabricImage.fromURL(imageUrl)

        state.canvas.add(t)

        const { width, height } = t.getBoundingRect()

        const multiplier = state.canvas.getZoom()

        state.canvas.setDimensions({ width: width * multiplier, height: height * multiplier })

        t.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top'
        })
        t.setCoords()

        const dataUrl = state.canvas.toDataURL({ format: 'png', multiplier: 1 })

        dataUrls.push(dataUrl)

        state.canvas.clear()
      }

      onResolve(dataUrls, imageIds)
    },
    [canvasRef.current]
  )

  useEffect(
    function initFabricCanvas() {
      if (!canvasRef.current) return

      state.canvas = new fabric.Canvas(canvasRef.current)

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

      const updateInfo = function (e: any) {
        const obj = e.target
        if (!obj) return

        if (!container.current) return

        const rect = container.current.querySelector('#object-rect')

        if (!rect) return

        const x = Math.round(obj.left * 10) / 10
        const y = Math.round(obj.top * 10) / 10
        const w = Math.round(obj.width * obj.scaleX * 10) / 10
        const h = Math.round(obj.height * obj.scaleY * 10) / 10

        rect.textContent = `X: ${x} Y: ${y} W: ${w} H: ${h}`
      }

      state.canvas.on('selection:created', updateInfo)
      state.canvas.on('selection:updated', updateInfo)
      state.canvas.on('object:moving', updateInfo)
      state.canvas.on('object:scaling', updateInfo)
      state.canvas.on('object:modified', updateInfo)
      state.canvas.on('object:added', function () {
        if (!state.canvas) return

        const objects = state.canvas.getObjects()

        if (objects.length !== 1) return

        const img = objects.at(0)

        if (!img) return

        const { width, height } = img.getBoundingRect()

        // state.canvas.setWidth(width)
        // state.canvas.setHeight(height)

        // need to relocate at top-left

        if (!container.current) return

        const canvasSizeDisplay = container.current.querySelector('#canvas-size')

        if (!canvasSizeDisplay) return

        canvasSizeDisplay.textContent = `W: ${width} H: ${height}`

        const multiplier = state.canvas.getZoom()

        state.canvas.setDimensions({ width: width * multiplier, height: height * multiplier })
        img.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top'
        })
        img.setCoords()
      })

      // crop
      state.canvas.on('mouse:down', function (opt) {
        if (!f_crop || !state.canvas) return

        const pointer = state.canvas.getPointer(opt.e)
        isDraggingCrop = true
        startX = pointer.x
        startY = pointer.y

        if (cropRect) state.canvas.remove(cropRect)

        cropRect = new fabric.Rect({
          left: startX,
          top: startY,
          width: 1,
          height: 1,
          fill: 'rgba(0,0,0,0.2)',
          stroke: 'red',
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top'
        })
        state.canvas.add(cropRect)
      })

      state.canvas.on('mouse:move', function (opt) {
        if (!f_crop || !state.canvas || !isDraggingCrop || !cropRect) return
        const pointer = state.canvas.getPointer(opt.e)
        const w = pointer.x - startX
        const h = pointer.y - startY

        if (w >= 0) {
          cropRect.set({ width: w, left: startX })
        } else {
          cropRect.set({ width: -w, left: pointer.x })
        }
        if (h >= 0) {
          cropRect.set({ height: h, top: startY })
        } else {
          cropRect.set({ height: -h, top: pointer.y })
        }
        cropRect.setCoords()
        state.canvas.renderAll()
      })

      state.canvas.on('mouse:up', async function () {
        if (!f_crop || !state.canvas) return

        if (!isDraggingCrop) return
        isDraggingCrop = false

        if (!cropRect) return
        const br = cropRect.getBoundingRect() // absolute

        state.canvas.remove(cropRect)

        const zoom = state.canvas.getZoom()

        const dataURL = state.canvas.toDataURL({
          left: br.left * zoom,
          top: br.top * zoom,
          width: br.width * zoom,
          height: br.height * zoom,
          format: 'png',
          multiplier: 1 / zoom, // zoom 만큼 확대된 걸 다시 원래 크기로 맞춤
          enableRetinaScaling: false
        })

        state.canvas.clear()
        state.canvas.selection = true
        state.canvas.defaultCursor = 'default'
        state.canvas.hoverCursor = 'move'
        state.canvas.forEachObject(function (o) {
          o.selectable = true
        })

        // re-render
        const cropped = await fabric.FabricImage.fromURL(dataURL)
        cropped.top = cropRect.top
        cropped.left = cropRect.left

        cropRect = null
        f_crop = false

        state.canvas.add(cropped)
        state.canvas.renderAll()
      })

      return function () {
        state.canvas?.off()
        state.canvas?.dispose()
      }
    },

    [canvasRef.current]
  )

  useEffect(
    function handleLayoutDimensionChange() {
      if (!layoutRef.current) return

      const threshold = 200
      let timeout: any

      const observer = new ResizeObserver(function (entries) {
        clearTimeout(timeout)

        timeout = setTimeout(function () {
          if (!layoutRef.current) return

          const width = layoutRef.current.scrollWidth
          const height = layoutRef.current.scrollHeight

          if (!container.current) return

          const layoutDimensionDisplay = container.current.querySelector('#layout-size')

          if (!layoutDimensionDisplay) return

          layoutDimensionDisplay.textContent = `W: ${width} H: ${height}`
        }, threshold)
      })

      observer.observe(layoutRef.current)

      return function () {
        observer.disconnect()
      }
    },
    [layoutRef.current]
  )

  useEffect(
    function () {
      if (!serializeOnly || !canvasRef.current || !state.canvas) return

      handleSerializeOnly()
    },
    [canvasRef.current]
  )

  useEffect(function () {
    Object.assign(window, { state })
  }, [])

  useEffect(function registerHotKeyHandler() {
    document.addEventListener('keydown', function (e) {
      if (!e.ctrlKey || !state.canvas) return

      switch (e.key.toLocaleLowerCase()) {
        case 's': {
          save()
          break
        }

        case 'c': {
          state.canvas.clear()
          break
        }

        default: {
          break
        }
      }
    })
  }, [])

  const state: {
    canvas: fabric.Canvas | undefined
    select: fabric.FabricObject | undefined
    imageIdsInCurrentCanvas: Array<string>
  } = {
    canvas: undefined,
    select: undefined,
    imageIdsInCurrentCanvas: []
  }

  let f_crop = false
  let isDraggingCrop = false
  let cropRect: fabric.Rect | null = null
  let startX = 0
  let startY = 0

  const urls = imageUrls.slice()
  const exports: Array<string> = []
  const ids: Array<string> = imageIds.slice()
  const exportIds: Array<string> = []

  return (
    <Container ref={container}>
      <Border>
        <Header>{header}</Header>

        <TextButtonsLayout1>
          <ButtonsContainer>
            <TextButton
              type='button'
              // disabled={!validated}
              onClick={function (e) {
                return onResolve(exports, exportIds)
              }}
            >
              <Span>확인</Span>
            </TextButton>

            <TextButton
              type='button'
              onClick={function (e) {
                onReject('user canceled')
              }}
            >
              <Span>취소</Span>
            </TextButton>
          </ButtonsContainer>
        </TextButtonsLayout1>

        <InputLayout>
          <InputContainer>
            <Left>
              <ImagesContainer
                onClick={async function (e) {
                  const clicked = e.target as HTMLElement

                  if (!clicked) return

                  const img = (
                    clicked.tagName.toLowerCase() === 'img' ? clicked : clicked.querySelector('img')
                  ) as HTMLImageElement

                  if (!img) return

                  if (!state.canvas) return

                  const t = await fabric.FabricImage.fromURL(img.src)

                  t.set('idx', img.id)

                  state.canvas.add(t)

                  state.imageIdsInCurrentCanvas.push(ids[parseInt(img.id, 10)])
                }}
              >
                {urls.map((url, i) => (
                  <ImageButton key={i}>
                    <img src={url} alt='failed to load' id={i.toString()} />
                  </ImageButton>
                ))}
              </ImagesContainer>
              <ImagesContainer
                onClick={async function (e) {
                  const clicked = e.target as HTMLElement

                  if (!clicked) return

                  const img = (
                    clicked.tagName.toLowerCase() === 'img' ? clicked : clicked.querySelector('img')
                  ) as HTMLImageElement

                  if (!img) return

                  if (!state.canvas) return

                  const t = await fabric.FabricImage.fromURL(img.src)

                  state.canvas.add(t)
                }}
              >
                {exports.map((url, i) => (
                  <ImageButton key={i}>
                    <img src={url} alt='failed to load' />
                  </ImageButton>
                ))}
              </ImagesContainer>
            </Left>
            <Center>
              <UtilityButtonsContainer>
                <LoadLabelAsButton htmlFor='image-input-file'>Load File</LoadLabelAsButton>
                <Input
                  id='image-input-file'
                  type='file'
                  onChange={function (e) {
                    console.log('file selected')

                    const file = e.target.files?.item(0)

                    if (!file) return console.error('no files')

                    const reader = new FileReader()

                    reader.onload = function (e) {
                      const dataUrl = e.target?.result

                      if (!dataUrl || typeof dataUrl !== 'string') return console.error('no data url;\n', dataUrl)

                      if (!container.current) return console.error('no container')

                      const c = container.current.querySelector(ImagesContainer)

                      if (!c) return

                      const i = document.createElement('button')

                      const img = document.createElement('img')

                      const extIdx = file.name.lastIndexOf('.')

                      img.id = Array.from(c.querySelectorAll('img')).length.toString()

                      img.src = dataUrl

                      i.append(img)

                      i.classList.add(ImageButton.toString().slice(1), Button.toString().slice(1))

                      c.append(i)

                      urls.push(dataUrl)

                      ids.push(extIdx === -1 ? file.name : file.name.slice(0, extIdx))
                      // setUrls((prev) => prev.concat([dataUrl]))
                    }

                    reader.readAsDataURL(file)
                  }}
                />
                <TextButton
                  onClick={async function () {
                    if (!state.canvas) return

                    const { value: url } = (await window.eh.sendEvent<Dialog>({
                      name: 'DIALOG',
                      payload: { type: 'prompt', header: 'input image url' },
                      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                    })) as Extract<Dialog, { payload: { type: 'prompt' } }>['returnType']

                    if (!url) return

                    const { value: id } = (await window.eh.sendEvent<Dialog>({
                      name: 'DIALOG',
                      payload: { type: 'prompt', header: 'input image id' },
                      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                    })) as Extract<Dialog, { payload: { type: 'prompt' } }>['returnType']

                    if (!url.startsWith('http')) {
                      if (!container.current) return console.error('no container')

                      const c = container.current.querySelector(ImagesContainer)

                      if (!c) return

                      const i = document.createElement('button')

                      const img = document.createElement('img')

                      img.src = url

                      i.append(img)

                      i.classList.add(ImageButton.toString().slice(1), Button.toString().slice(1))

                      c.append(i)

                      urls.push(url)

                      ids.push(id)

                      return
                    }

                    const response = await fetch(url)
                    const buffer = await response.arrayBuffer()

                    // 2. buffer -> blob
                    const byteArray = new Uint8Array(buffer)
                    const blob = new Blob([byteArray], { type: response.headers.get('Content-Type') || 'image/png' })

                    const reader = new FileReader()

                    reader.onload = function (e) {
                      const dataUrl = e.target?.result

                      if (!dataUrl || typeof dataUrl !== 'string') return console.error('no data url;\n', dataUrl)

                      if (!container.current) return console.error('no container')

                      const c = container.current.querySelector(ImagesContainer)

                      if (!c) return

                      const i = document.createElement('button')

                      const img = document.createElement('img')

                      img.src = dataUrl

                      i.append(img)

                      i.classList.add(ImageButton.toString().slice(1), Button.toString().slice(1))

                      c.append(i)

                      urls.push(dataUrl)

                      ids.push(id)

                      // ids.push(new URL(url).pathname)

                      // setUrls((prev) => prev.concat([dataUrl]))
                    }

                    reader.readAsDataURL(blob)
                  }}
                >
                  Load From URL
                </TextButton>
                <TextButton
                  onClick={async function () {
                    if (!state.canvas) return

                    state.canvas.setZoom(state.canvas.getZoom() + 0.25)
                    state.canvas.renderAll()
                  }}
                >
                  Zoom In
                </TextButton>

                <TextButton
                  onClick={async function () {
                    if (!state.canvas) return

                    state.canvas.setZoom(state.canvas.getZoom() - 0.25)
                    state.canvas.renderAll()
                  }}
                >
                  Zoom Out
                </TextButton>

                <TextButton
                  onClick={function () {
                    if (!state.canvas) return

                    state.imageIdsInCurrentCanvas = []
                    state.canvas.clear()
                  }}
                >
                  Clear
                </TextButton>
                <TextButton onClick={save}>Save</TextButton>

                <TargetButton
                  // disabled
                  onClick={function () {
                    console.log('removing selection')
                    if (!state.canvas) return console.log('failed to remove')

                    const select = state.canvas.getActiveObject()
                    if (!select) return

                    // const select = state.canvas.getActiveObject()

                    // if (!select) return

                    state.canvas.remove(select)

                    const idx = select.get('idx')

                    state.imageIdsInCurrentCanvas.splice(parseInt(idx, 10), 1)
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
                <TextButton
                  onClick={async function () {
                    if (!state.canvas) return

                    f_crop = true

                    state.canvas.discardActiveObject()
                    state.canvas.selection = false
                    state.canvas.defaultCursor = 'crosshair'
                    state.canvas.hoverCursor = 'crosshair'
                    state.canvas.forEachObject(function (o) {
                      o.selectable = false
                    })
                  }}
                >
                  Crop
                </TextButton>
                <TargetButton
                  // disabled
                  onClick={function () {
                    if (!state.canvas || !state.select || state.select.type !== 'image') return

                    const { width, height } = state.select.getBoundingRect()

                    // state.canvas.setWidth(width)
                    // state.canvas.setHeight(height)

                    // need to relocate at top-left

                    if (!container.current) return

                    const canvasSizeDisplay = container.current.querySelector('#canvas-size')

                    if (!canvasSizeDisplay) return

                    canvasSizeDisplay.textContent = `W: ${width} H: ${height}`

                    const multiplier = state.canvas.getZoom()

                    state.canvas.setDimensions({ width: width * multiplier, height: height * multiplier })
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
              <CanvasLayout ref={layoutRef}>
                <CanvasContainer
                  defaultWidth={width ? width - 20 : 580}
                  defaultHeight={height ? height - 20 : 580}
                  ref={function (ref) {
                    if (!ref) return

                    const threshold = 200
                    let timeout: any

                    const observer = new ResizeObserver(function (entries) {
                      clearTimeout(timeout)
                      const { width, height } = entries[0].contentRect

                      console.log('change: ', width, height)

                      timeout = setTimeout(function () {
                        if (!state.canvas) return

                        const w = Math.max(width - 20, 0)
                        const h = Math.max(height - 20, 0)

                        state.canvas.setDimensions({ width: w, height: h })

                        if (!container.current) return

                        const canvasSizeDisplay = container.current.querySelector('#canvas-size')

                        if (!canvasSizeDisplay) return

                        canvasSizeDisplay.textContent = `W: ${w} H: ${h}`
                      }, threshold)
                    })

                    observer.observe(ref)
                  }}
                  // onClickCapture={function (e) {
                  //   console.log('container click capture, discarding selection')
                  // }}
                >
                  <Canvas ref={canvasRef} />
                </CanvasContainer>
              </CanvasLayout>
            </Center>
          </InputContainer>
        </InputLayout>

        <StatusLayout>
          {/* would be better if interpret result has values by interpreting layers */}

          {/* <TextButtonsLayout1>
          {currentKey &&
            $record[currentKey].interpretation.map(({ parser }, index) => (
              <TextButton
                key={index}
                type='button'
                onClick={function (e) {
                  setCurrentInterpretationLayer($record[currentKey].interpretation[index])
                }}
              >
                <Span>{parser}</Span>
              </TextButton>
            ))}
        </TextButtonsLayout1> */}
          <DisplayLayout>
            <LayoutSize
              title='layout'
              id='layout-size'
              onClick={async function () {
                if (!layoutRef.current) return

                const w = layoutRef.current.scrollWidth
                const h = layoutRef.current.scrollHeight

                const { width, height } = (await window.eh.sendEvent<Dialog>({
                  name: 'DIALOG',
                  meta: { receiver: { alias: 'MAIN', component: 'MAIN' } },
                  payload: {
                    type: 'form',
                    header: 'input width, height',
                    record: { width: w.toString(), height: h.toString() }
                  }
                })) as Extract<Dialog, { type: 'form' }>['returnType']

                layoutRef.current.style.width = `${width}px`
                layoutRef.current.style.height = `${height}px`
              }}
            >
              {`W: ${width} H: ${height}`}
            </LayoutSize>
            <CanvasSize
              title='canvas'
              id='canvas-size'
              onClick={async function () {
                if (!state.canvas) return

                const width = state.canvas.getWidth()
                const height = state.canvas.getHeight()

                const { width: w, height: h } = (await window.eh.sendEvent<Dialog>({
                  name: 'DIALOG',
                  meta: { receiver: { alias: 'MAIN', component: 'MAIN' } },
                  payload: {
                    type: 'form',
                    header: 'input width, height',
                    record: { width: width.toString(), height: height.toString() }
                  }
                })) as Extract<Dialog, { type: 'form' }>['returnType']

                state.canvas.setDimensions({ width: parseFloat(w), height: parseFloat(h) })
              }}
            >
              W: 0 H: 0
            </CanvasSize>
            <ObjectRect
              title='select'
              id='object-rect'
              onClick={async function () {
                if (!state.canvas) return

                const select = state.canvas.getActiveObject()

                if (!select) return

                const { height, left, top, width } = select.getBoundingRect()

                const {
                  width: w,
                  height: h,
                  x,
                  y
                } = (await window.eh.sendEvent<Dialog>({
                  name: 'DIALOG',
                  meta: { receiver: { alias: 'MAIN', component: 'MAIN' } },
                  payload: {
                    type: 'form',
                    header: 'input width, height',
                    record: {
                      width: width.toString(),
                      height: height.toString(),
                      x: left.toString(),
                      y: top.toString()
                    }
                  }
                })) as Extract<Dialog, { type: 'form' }>['returnType']

                select.set({ width: parseFloat(w), height: parseFloat(h), left: parseFloat(x), top: parseFloat(y) })

                state.canvas.setDimensions({ width: parseFloat(w), height: parseFloat(h) })
              }}
            >
              X:0 Y: 0 W: 0 H: 0
            </ObjectRect>
          </DisplayLayout>
        </StatusLayout>
      </Border>
    </Container>
  )
}

export default ImageEditor

const Container = styled(FlexColumnDiv)<{ width?: number; height?: number }>`
  padding: var(--padding-default, 8px);
  border-radius: var(--border-radius-default, 8px);
  background-color: white;
  box-shadow: var(--shadow-elevation4);
  min-width: 0;
  // width: ${({ width }) => width || 600}px;
  // height: ${({ height }) => height || 450}px;

  & > *:not(:first-child) {
    margin-top: 4px;
  }

  & textarea {
    ${SCROLL}
  }

  & textarea::placeholder {
    font-size: 28px;
    font-style: italic;
  }
`

const Border = styled(FlexColumnDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  min-height: 0;
  min-width: 0;
`

const Header = styled(Span)`
  font-size: 16px;
  font-weight: bold;
  // font-style: italic;
  margin: 6px 0;
  word-break: auto-phrase;
`

const StatusLayout = styled(FlexCenterDiv)`
  justify-content: space-between;
  2px 4px;
`

const InputLayout = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
`

const ModeSVGContainer = styled(FlexCenterDiv)`
  position: relative;
  & > svg {
    width: 20px;
    height: 20px;
  }
`

const ButtonsContainer = styled(FlexCenterDiv)`
  margin: 4px 0;
  font-size: 12px;

  & > button:first-of-type {
    margin-right: 4px;
  }

  & button {
    border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
    padding: 6px;
    margin-right: 4px;
    box-shadow: var(--shadow-elevation);
  }
`

const shrink = keyframes`
  0% {
    width : 100%;
  }

  100% {
    width : 0;
  }
`
const InputContainer = styled(FlexDiv)`
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

const CanvasContainer = styled(Div)<{ defaultWidth: number; defaultHeight: number }>`
  width: ${({ defaultWidth }) => defaultWidth}px;
  height: ${({ defaultHeight }) => defaultHeight}px;
  // resize: both;
  // overflow: auto;
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

  * button {
    font: inherit;
    color: inherit;
    outline: none;
    border: 0;
    background-color: transparent;
    padding: 0;
    cursor: pointer;
  }
`

const ImageButton = styled(Button)``

const UtilityButtonsContainer = styled(FlexDiv)``

const TargetButton = styled(TextButton)`
  cursor: no-drop;
`

const LayoutSize = styled(TextButton)`
  font-size: 12px;
`
const CanvasSize = styled(TextButton)`
  font-size: 12px;
`

const ObjectRect = styled(TextButton)`
  font-size: 12px;
`

const DisplayLayout = styled(FlexDiv)`
  flex: 1;
  margin-top: 8px;
  justify-content: space-between;
  align-items: center;
`

const CanvasLayout = styled(Div)`
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 4px;
  overflow: scroll;
  ${SCROLL}
`

const LoadLabelAsButton = styled(TextButton.withComponent('label'))`
  cursor: pointer;

  & + input {
    display: none;
  }
`
