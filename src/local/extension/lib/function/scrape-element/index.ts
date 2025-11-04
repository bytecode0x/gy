import {
  extractSelector,
  getDescendantNode,
  getNextDescendingNode,
  getOwnerIframe,
  recursiveExtractSelector,
  recursiveExtractStructure
} from 'lib/util/dom/common'
import { __Action__Scrape } from 'local/desktop/main/gy/type/action.preset'

type ScraperOptions = {
  root?: Array<HTMLElement>
  exclude?: Array<HTMLElement>
  color: string
  plural?: boolean
  onCurrentChange?: (ele: HTMLElement | null) => void | (() => void)
  onStop?: () => void
}

type ScraperState = {
  current: HTMLElement | null

  select: Array<HTMLElement>

  query: __Action__Scrape['schema']['items'][number]['query']

  hover: Array<HTMLElement>

  family: Array<Array<HTMLElement>>

  plural: boolean | undefined

  root: Array<HTMLElement>

  exclude: Array<HTMLElement>

  group: Array<HTMLElement>

  depth: number | undefined

  number: number | undefined

  includeClassList: boolean

  color: string

  onCurrentChange?: (ele: HTMLElement | null) => void | (() => void)

  onStop?: () => void

  cleanupPrevious?: (() => void) | void

  start: () => void

  finish: () => __Action__Scrape['schema']['items'][number]['query']

  stop: (reason?: string) => void

  setDepth: (depth: number | undefined) => void

  setNumber: (number: number | undefined) => void

  setIncludeClassList: (includeClassList: boolean) => void
}

export function createScraper({ color, exclude, root, plural, onStop, onCurrentChange }: ScraperOptions) {
  const state: ScraperState = {
    color,
    current: null,
    exclude: exclude || [],
    root:
      root ||
      [window.top?.document.documentElement || document.documentElement].concat(
        Array.from(document.querySelectorAll('iframe'))
          .map((i) => i.contentDocument)
          .filter((doc): doc is Document => !!doc)
          .map((doc) => doc.documentElement)
      ),
    select: [],
    query: [],
    hover: [],
    family: [],
    group: [window.top?.document.documentElement || document.documentElement].concat(
      Array.from(document.querySelectorAll('iframe'))
        .map((i) => i.contentDocument)
        .filter((doc): doc is Document => !!doc)
        .map((doc) => doc.documentElement)
    ),
    includeClassList: true,
    depth: undefined,
    number: undefined,
    plural,
    start,
    finish,
    stop,
    setDepth,
    setIncludeClassList,
    setNumber,
    onCurrentChange,
    onStop
  }

  function start() {
    state.root.forEach((ele) => {
      ele.addEventListener('keydown', _handleKey, { capture: true })
      ele.addEventListener('mouseover', _handleMouseover, { capture: true })
      ele.addEventListener('click', _handleClick, { capture: true })
    })
  }

  function finish(): __Action__Scrape['schema']['items'][number]['query'] {
    _cleanup()
    return state.query
  }

  function stop(reason?: string) {
    _cleanup()
    if (state.onStop) state.onStop()
  }

  function setDepth(depth: number | undefined) {
    state.depth = depth
  }

  function setNumber(number: number | undefined) {
    state.number = number
  }

  function setIncludeClassList(includeClassList: boolean) {
    state.includeClassList = includeClassList
  }

  function __createHovers(ele: HTMLElement) {
    // if (!plural.current) return []
    const selector =
      state.plural === true
        ? recursiveExtractStructure(ele, state.depth, state.includeClassList)
        : recursiveExtractSelector(ele, state.depth)

    return Array.from(ele.ownerDocument.querySelectorAll(selector)).slice(
      0,
      state.number === undefined ? undefined : state.number > 1 ? state.number - 1 : 0
    ) as Array<HTMLElement>
  }

  function __assertBorderOverlay(ownerDocument: Document) {
    let ol = ownerDocument.querySelector('#gatsby-border-ol') as HTMLDivElement
    if (!ol) {
      ol = ownerDocument.createElement('div') as HTMLDivElement
      ol.setAttribute('id', 'gatsby-border-ol')
      ol.style.position = 'absolute'
      ol.style.top = '0'
      ol.style.left = '0'
      ol.style.pointerEvents = 'none'
      ol.style.zIndex = '2147483646'

      ownerDocument.body.append(ol)
    }
    return ol
  }

  function __drawOverlayBorder(
    // ownerDocument: Document,
    // ol: HTMLElement,
    target: HTMLElement,
    border: string
  ) {
    const { top, left, width, height } = target.getBoundingClientRect()
    const ol = __assertBorderOverlay(target.ownerDocument)
    const borderElement = target.ownerDocument.createElement('div')
    borderElement.style.position = 'absolute'
    borderElement.style.top = `${
      top + (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollTop : 0)
    }px`
    borderElement.style.left = `${
      left + (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollLeft : 0)
    }px`
    borderElement.style.width = `${width}px`
    borderElement.style.height = `${height}px`
    borderElement.style.boxSizing = 'border-box'

    borderElement.style.border = border
    ol.append(borderElement)

    return borderElement
  }

  function __createFamily(ele: HTMLElement) {
    // if (!plural.current) return []
    const selector =
      state.plural === true
        ? recursiveExtractStructure(ele, state.depth, state.includeClassList)
        : recursiveExtractSelector(ele, state.depth)
    return Array.from(ele.ownerDocument.querySelectorAll(selector)).filter((ele) =>
      state.group.some((g) => g.contains(ele))
    ) as Array<HTMLElement>
  }

  function _handleMouseover(e: MouseEvent) {
    e.stopImmediatePropagation()
    if (!e.target) return

    // erase
    state.root.flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-hover]'))).forEach((s) => s.remove())

    state.hover = __createHovers(e.target as HTMLElement)

    state.hover
      ?.filter((f) => state.group.some((g) => g.contains(f)))
      .forEach((ele) => __drawOverlayBorder(ele, `1px dotted ${state.color}`).setAttribute('data-gatsby-hover', 'true'))
  }

  function _handleClick(e: MouseEvent) {
    if (state.exclude.some((ele) => ele.contains(e.target as HTMLElement))) return
    e.preventDefault()

    if (!e.currentTarget || !e.target) return

    e.stopImmediatePropagation()

    if (!state.group.some((g) => g.contains(e.target as HTMLElement))) return

    if (!state.plural) {
      state.select.pop()
      state.family.pop()
      state.query.pop()
      state.current = e.target as HTMLElement
      state.select.push(state.current)
      state.family.push(__createFamily(state.current))
      const frame = getOwnerIframe(state.current)
      state.query.push({
        selector: recursiveExtractSelector(state.current, state.depth),
        frame: frame && extractSelector(frame),
        exclusions: []
      })
    } else if (e.ctrlKey && state.select.some((s) => s.contains(e.target as HTMLElement))) {
      const index = state.select.findIndex((s) => s === e.target)!

      state.select.splice(index, 1)
      state.query.splice(index, 1)
      state.family.splice(index, 1)
      state.current = state.select[state.select.length - 1]
    } else if (e.ctrlKey && state.family.some((f) => f.some((ele) => ele.contains(e.target as HTMLElement)))) {
      const row_index = state.family.findIndex((f) => f.includes(e.target as HTMLElement))!
      const col_index = state.family[row_index].findIndex((ele) => ele.contains(e.target as HTMLElement))!

      if (state.query[row_index].exclusions.includes(col_index))
        state.query[row_index].exclusions = state.query[row_index].exclusions.filter((v) => v !== col_index)
      else state.query[row_index].exclusions.push(col_index)
    } else if (e.ctrlKey) {
      state.current = e.target as HTMLElement
      state.select.push(state.current)
      state.family.push(__createFamily(state.current))

      const frame = getOwnerIframe(state.current)
      state.query.push({
        selector: recursiveExtractStructure(state.current, state.depth, state.includeClassList),
        frame: frame && extractSelector(frame),
        exclusions: []
      })
    } else {
      state.select.pop()
      state.family.pop()
      state.query.pop()
      state.current = e.target as HTMLElement
      state.select.push(state.current)
      state.family.push(__createFamily(state.current))
      const frame = getOwnerIframe(state.current)
      state.query.push({
        selector: recursiveExtractStructure(state.current, state.depth, state.includeClassList),
        frame: frame && extractSelector(frame),
        exclusions: []
      })
    }

    // erase previous select border
    state.root
      .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-select], [data-gatsby-family]')))
      .forEach((s) => s.remove())
    // roots.current
    //   .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-family]')))
    //   .forEach((s) => s.remove())

    // set, draw select
    state.select.forEach((s) =>
      __drawOverlayBorder(s, `3px solid ${state.color}`).setAttribute('data-gatsby-select', 'true')
    )

    // // set, draw family
    // family.current = createFamily(e.target as HTMLElement)

    state.family.forEach((f, row_index) =>
      f
        .filter((ele) => state.group.some((g) => g.contains(ele)))
        .forEach(
          (ele, col_index) =>
            !state.query[row_index].exclusions.includes(col_index) &&
            __drawOverlayBorder(ele, `2px dotted ${state.color}`).setAttribute('data-gatsby-family', 'true')
        )
    )

    if (state.cleanupPrevious) state.cleanupPrevious()

    if (state.onCurrentChange) state.cleanupPrevious = state.onCurrentChange(state.current)

    // state.formContainer?.remove()
    // if (!state.current) return
    // state.formContainer = createAppendingContainerWithRelativeCoordinates(state.current, 630, 170, 0, 0)

    // //   const layer = safeGetBody().querySelector('#gatsby-frame') as HTMLDivElement
    // // const layer = (e.target as HTMLElement).ownerDocument.querySelector('#gatsby-border-ol') as HTMLDivElement
    // layer.append(state.formContainer)
    // if (onClick) onClick(e, state.formContainer)
    // state.formContainer.append(form)
  }

  function _handleKey(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape': {
        return state.stop('canceled by user; esc key pressed')
      }
      case 'ArrowUp': {
        if (!state.current) return
        e.preventDefault()
        if (e.target instanceof HTMLElement && !state.exclude.some((ele) => ele.contains(e.target as HTMLElement)))
          e.stopPropagation()

        const upper =
          [
            state.current.previousElementSibling && getDescendantNode(state.current.previousElementSibling),
            state.current.parentElement
          ].find((ele) => state.group.some((g) => g.contains(ele))) || state.current

        state.current = state.exclude.some((ele) => ele.contains(upper)) ? state.current : (upper as HTMLElement)
        // family.current = createFamily(select.current)
        break
      }
      case 'ArrowDown': {
        if (!state.current) return
        e.preventDefault()
        if (e.target instanceof HTMLElement && !state.exclude.some((ele) => ele.contains(e.target as HTMLElement)))
          e.stopPropagation()

        const downer =
          [
            state.current.firstElementChild,
            state.current.nextElementSibling,
            getNextDescendingNode(state.current)
          ].find((ele) => state.group.some((g) => g.contains(ele))) || state.current

        state.current = state.exclude.some((ele) => ele.contains(downer)) ? state.current : (downer as HTMLElement)
        // family.current = createFamily(select.current)
        break
      }
      default: {
        return
      }
    }

    state.select.pop()
    state.select.push(state.current)

    state.query.pop()
    const frame = getOwnerIframe(state.current)
    state.query.push({
      // selector: recursiveExtractStructure(current.current),
      selector: state.plural
        ? recursiveExtractStructure(state.current, state.depth, state.includeClassList)
        : recursiveExtractSelector(state.current, state.depth),
      frame: frame && extractSelector(frame),
      exclusions: []
    })

    const currentFamily = __createFamily(state.current)
    state.family.pop()
    state.family.push(currentFamily)

    // erase previous select border
    state.root
      .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-select], [data-gatsby-family]')))
      .forEach((s) => s.remove())

    // set, draw select
    state.select.forEach((s) =>
      __drawOverlayBorder(s, `3px solid ${state.color}`).setAttribute('data-gatsby-select', 'true')
    )

    // // set, draw family
    state.family.forEach((f) =>
      f
        .filter((ele) => state.group.some((g) => g.contains(ele)))
        .forEach((ele) =>
          __drawOverlayBorder(ele, `2px dotted ${state.color}`).setAttribute('data-gatsby-family', 'true')
        )
    )

    if (state.cleanupPrevious) state.cleanupPrevious()

    if (state.onCurrentChange) state.cleanupPrevious = state.onCurrentChange(state.current)
  }

  function _cleanup() {
    state.root.forEach((ele) => {
      ele.removeEventListener('keydown', _handleKey, { capture: true })
      ele.removeEventListener('mouseover', _handleMouseover, { capture: true })
      ele.removeEventListener('click', _handleClick, { capture: true })
      ele.querySelectorAll('#gatsby-border-ol').forEach((b) => b.remove())
    })
  }

  return state
}
