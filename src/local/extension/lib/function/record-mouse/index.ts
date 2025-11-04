import { createOverlayMaskOn } from 'lib/util/dom/common'
import { __Action__Click } from 'local/desktop/main/gy/type/action.preset'
import { MouseRecord, MouseTape } from 'type'
import { v4 } from 'uuid'

type MouseCapturerOptions = {
  color: string
  onRecordCapture?: (partial: MouseTape['value'][number]) => void
  // target: HTMLElement
  // context?: MouseTape['context']
}

type MouseCapturerState = {
  tape?: MouseTape

  // context?: MouseTape['context']

  isTruncating: boolean

  isRecording: boolean

  isStrict: boolean

  isHolding: boolean

  target?: HTMLElement

  mask?: HTMLElement

  start: () => void

  record: () => void

  stop: () => void

  undo: () => void

  finish: () => MouseTape

  setTarget: (target: HTMLElement, context: MouseTape['context']) => void

  onRecordCapture?: (partial: MouseTape['value'][number]) => void
}

export function createMouseCapturer({ color, onRecordCapture }: MouseCapturerOptions) {
  const id = v4()
  const state: MouseCapturerState = {
    isHolding: false,
    isRecording: false,
    isStrict: true,
    isTruncating: true,
    start,
    record,
    finish,
    stop,
    undo,
    setTarget,
    onRecordCapture
  }

  let deviationStart: number

  return state

  function __assertCaptureOverlay() {
    if (!state.target) return

    let ol = state.target.ownerDocument.querySelector('#gatsby-capture-ol') as HTMLDivElement
    if (!ol) {
      ol = state.target.ownerDocument.createElement('div') as HTMLDivElement
      ol.setAttribute('id', 'gatsby-capture-ol')
      ol.style.position = 'absolute'
      ol.style.top = '0'
      ol.style.left = '0'
      // ol.style.pointerEvents = 'none'
      ol.style.zIndex = '2147483646'

      state.target.ownerDocument.body.append(ol)
    }
    return ol
  }

  function _createMask() {
    if (!state.target) return

    const { top, left, width, height } = state.target.getBoundingClientRect()
    const ol = __assertCaptureOverlay()

    if (!ol) return

    let mask = ol.querySelector(`[data-tape-id="${id}"]`) as HTMLDivElement
    if (mask) return mask
    mask = state.target.ownerDocument.createElement('div')
    mask.setAttribute('data-tape-id', id)
    mask.style.position = 'absolute'
    mask.style.top = `${
      top + (state.target.ownerDocument.scrollingElement ? state.target.ownerDocument.scrollingElement.scrollTop : 0)
    }px`
    mask.style.left = `${
      left + (state.target.ownerDocument.scrollingElement ? state.target.ownerDocument.scrollingElement.scrollLeft : 0)
    }px`
    mask.style.width = `${width}px`
    mask.style.height = `${height}px`
    mask.style.boxSizing = 'border-box'
    mask.style.border = `3px solid ${color}`

    ol.append(mask)
    state.mask = mask
    return mask
  }

  function __removeCaptureOverlay() {
    if (!state.target) return
    state.target.ownerDocument.querySelector('#gatsby-capture-ol')?.remove()
  }

  function __pseudoRecord(partial: MouseTape['value'][number], x: number, y: number) {
    partial.push({ x, y, duration: Date.now() })
  }

  function __computeDeviation(partial: MouseTape['value'][number]) {
    if (partial.length < 2) throw new Error('record length must be higher than 2')
    partial.forEach(function (curr, index) {
      if (index === 0) return
      const prev = partial[index - 1]
      prev.duration = curr.duration - prev.duration
      if (index === partial.length - 1) curr.duration = 0
    })
  }

  function _handleMouseMove(me: MouseEvent) {
    // me.stopImmediatePropagation()
    if (me.currentTarget !== state.mask || me.target !== state.mask) return

    const vertical = state.mask.querySelector('#vertical') as HTMLDivElement
    const horizontal = state.mask.querySelector('#horizontal') as HTMLDivElement
    const label = state.mask.querySelector('#coordinates') as HTMLLabelElement

    const x = me.offsetX
    const y = me.offsetY

    vertical.style.left = `${x}px`
    horizontal.style.top = `${y}px`
    label.style.left = `${x + 6}px`
    label.style.top = `${y + 6}px`
    label.innerText = `X: ${x.toLocaleString(undefined, {
      minimumIntegerDigits: 4
    })}px, Y: ${y.toLocaleString(undefined, { minimumIntegerDigits: 4 })}px`

    if (state.isRecording && (!state.isTruncating || state.isHolding))
      __pseudoRecord(state.tape!.value[state.tape!.value.length - 1], x, y)
  }

  function _handleMouseDown(me: MouseEvent) {
    /**
     * callbacks invoked once even though you keep holding it
     */

    if (me.currentTarget !== state.mask || me.target !== state.mask) return

    if (!state.mask || !state.tape) return

    state.mask.classList.add('transparent')

    state.tape.value.push([])
    state.isRecording = true
    state.isHolding = true
    // record when holding for now
    // state.isRecording = true

    const x = me.offsetX
    const y = me.offsetY

    // mouse down should record no matter what
    // if you set record flag in another mousedown event listener
    // It can be set after recording
    // so It is better record without checking the flag
    // if (state.isRecording)
    deviationStart = Date.now()

    __pseudoRecord(state.tape.value[state.tape.value.length - 1], x, y)
  }

  function _handleMouseUp(me: MouseEvent) {
    // me.stopImmediatePropagation()

    if (me.currentTarget !== state.mask || me.target !== state.mask) return

    if (!state.tape) return

    state.mask.classList.remove('transparent')

    /** prevent to be invoked on clicking utility buttons */
    // const buttonLayer = document.getElementById('button-layer')
    // if (buttonLayer?.contains(me.target as HTMLElement)) return

    state.isHolding = false
    // state.isRecording = false

    const x = me.offsetX
    const y = me.offsetY

    const partial = state.tape.value[state.tape.value.length - 1]

    __pseudoRecord(partial, x, y)

    _draw(partial)

    if (state.onRecordCapture) state.onRecordCapture(partial)

    __computeDeviation(partial)

    // cleanup()
    // return resolve(state.tape)

    // setTapes(state.tapes.slice())
  }

  function _cleanup() {
    if (!state.mask) return
    state.mask.removeEventListener('mousemove', _handleMouseMove, { capture: true })
    state.mask.removeEventListener('mouseup', _handleMouseUp, { capture: true })
    state.mask.removeEventListener('mousedown', _handleMouseDown, { capture: true })
    __removeCaptureOverlay()
  }

  function start() {
    if (!state.mask || !state.target) return

    state.mask.addEventListener('mousemove', _handleMouseMove, { capture: true })
    state.mask.addEventListener('mouseup', _handleMouseUp, { capture: true })
    state.mask.addEventListener('mousedown', _handleMouseDown, { capture: true })

    const vertical = state.mask.ownerDocument.createElement('div')
    vertical.style.height = '100%'
    vertical.style.width = '0'
    vertical.style.position = 'absolute'
    vertical.style.top = '0'
    vertical.style.left = '0'
    vertical.style.background = 'transparent'
    vertical.style.borderTop = '1px dotted blue'
    vertical.style.borderLeft = '1px dotted blue'
    vertical.style.pointerEvents = 'none'
    vertical.id = 'vertical'

    const horizontal = state.mask.ownerDocument.createElement('div')
    horizontal.style.height = '0'
    horizontal.style.width = '100%'
    horizontal.style.position = 'absolute'
    horizontal.style.top = '0'
    horizontal.style.left = '0'
    horizontal.style.background = 'transparent'
    horizontal.style.borderTop = '1px dotted blue'
    horizontal.style.borderLeft = '1px dotted blue'
    horizontal.style.pointerEvents = 'none'
    horizontal.id = 'horizontal'

    const coordinates = state.mask.ownerDocument.createElement('label')
    coordinates.style.position = 'absolute'
    coordinates.style.top = '0'
    coordinates.style.left = '0'
    coordinates.style.padding = '10px'
    coordinates.style.margin = '10px'
    coordinates.style.font = '14px arial'
    coordinates.style.color = '#fff'
    coordinates.style.background = 'rgba(0, 0, 0, 0.5)'
    coordinates.style.borderRadius = '24px'
    coordinates.style.whiteSpace = 'nowrap'
    coordinates.id = 'coordinates'

    state.mask.append(vertical, horizontal, coordinates)
  }

  function record() {
    console.log('record')
    state.isRecording = true
  }

  function finish() {
    if (!state.tape) throw new Error('TAPE_NOT_INITIALIZED')
    console.log('finish')
    state.isRecording = false

    _cleanup()
    return state.tape
  }

  function stop() {
    _cleanup()
  }

  function undo() {
    if (!state.tape || !state.mask) return
    state.tape.value.length = state.tape.value.length > 0 ? state.tape.value.length - 1 : 0
    state.mask.querySelector('svg:last-of-type')?.remove()
  }

  function setTarget(target: HTMLElement, context: MouseTape['context']) {
    _cleanup()
    state.target = target
    state.mask = _createMask()
    state.tape = { value: [], id: v4(), color, context, name: '', strict: true }
  }

  function _draw(record: MouseRecord[]) {
    if (!state.mask) return
    const simplified = simplify(record, 0.1)

    const isDrag = !simplified.every((p) => p.x === simplified[0].x && p.y === simplified[0].y)

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.position = 'absolute'
    svg.style.left = '0'
    svg.style.top = '0'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.pointerEvents = 'none'

    if (isDrag) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', pointsToSvgPath(simplified))
      path.setAttribute('stroke', color)
      path.setAttribute('strokeWidth', '2')
      path.setAttribute('fill', 'none')

      svg.append(path)
    } else {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', simplified[0].x.toString())
      circle.setAttribute('cy', simplified[0].y.toString())
      circle.setAttribute('r', '5')
      circle.setAttribute('fill', color)

      svg.append(circle)
    }
    state.mask.append(svg)
  }
}

/**
 * need a specific function for drawing only
 * because the internal method, _draw, draws on the mask which must be responsible mouse interactions
 * so if you doesn't clean it up after designing the action
 * It would prevent users from interacting with elements covered by the mask
 */
export function drawMouseRecordOn(target: HTMLElement, tape: MouseTape) {
  const mask = createOverlayMaskOn(target, 'mouse-record-overlay')
  mask.setAttribute('data-tape-mask', tape.id)

  tape.value.forEach(function (record) {
    const isDrag = !record.every((p) => p.x === record[0].x && p.y === record[0].y)

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.position = 'absolute'
    svg.style.left = '0'
    svg.style.top = '0'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.pointerEvents = 'none'

    if (isDrag) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', pointsToSvgPath(record))
      path.setAttribute('stroke', tape.color)
      path.setAttribute('strokeWidth', '2')
      path.setAttribute('fill', 'none')

      svg.append(path)
    } else {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', record[0].x.toString())
      circle.setAttribute('cy', record[0].y.toString())
      circle.setAttribute('r', '5')
      circle.setAttribute('fill', tape.color)

      svg.append(circle)
    }
    mask.append(svg)
  })
}

type Point = __Action__Click['schema']['tapes'][number]['value'][number][number]
/**
 * the Ramer-Douglas-Peucker algorithm
 */
export function simplify(points: Array<Point>, epsilon: number): Array<Point> {
  if (points.length <= 2) {
    return points
  }

  function findMaxDistance(points: Array<Point>) {
    let maxDistance = 0
    let index = 0

    for (let i = 1; i < points.length - 1; i++) {
      const distance = perpendicularDistance(points[i], points[0], points[points.length - 1])

      if (distance > maxDistance) {
        maxDistance = distance
        index = i
      }
    }

    return { index, maxDistance }
  }

  function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point) {
    const { x: x1, y: y1 } = lineStart
    const { x: x2, y: y2 } = lineEnd
    const { x, y } = point

    const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1)
    const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2)

    return numerator / denominator
  }

  const { index, maxDistance } = findMaxDistance(points)

  if (maxDistance > epsilon) {
    const firstSegment = simplify(points.slice(0, index + 1), epsilon)
    const secondSegment = simplify(points.slice(index), epsilon)

    return firstSegment.slice(0, -1).concat(secondSegment)
  } else {
    return [points[0], points[points.length - 1]]
  }
}

export function pointsToSvgPath(points: Array<Point>) {
  if (points.length < 2) {
    return ''
  }

  return (
    `M ${points[0].x} ${points[0].y}` +
    ` ${points
      .slice(1)
      .map((point) => `L ${point.x} ${point.y}`)
      .join(' ')}`
  )
}
