const REG_CSS_SELECTOR_META_CHARACTER = /[\{\}\~\+\>\s\:\#\,\[\]\(\)]/i

export function onLoading(doc: Document) {
  return new Promise<void>(function (resolve, reject) {
    if (doc.readyState === 'complete') return resolve()

    doc.addEventListener(
      'readystatechange',
      function handleStateChange() {
        if (doc.readyState !== 'complete') return
        return resolve()
      },
      { once: true }
    )
  })
  // .then(function () {
  //   return Promise.all(
  //     Array.from(doc.querySelectorAll('iframe'))
  //       .filter((i) => i.contentDocument)
  //       .map(
  //         (i) =>
  //           new Promise<void>(function (resolve) {
  //             if (i.contentDocument?.readyState === 'complete') return resolve()

  //             i.contentDocument?.addEventListener(
  //               'readystatechange',
  //               function () {
  //                 if (i.contentDocument?.readyState === 'complete') return resolve()
  //               },
  //               { once: true }
  //             )

  //             i.addEventListener(
  //               'load',
  //               function () {
  //                 resolve()
  //               },
  //               { once: true }
  //             )
  //           })
  //       )
  //   )
  // })
}

export function onLoad() {
  return new Promise<void>(function (resolve) {
    window.addEventListener(
      'load',
      function () {
        resolve()
      },
      { once: true }
    )
  })
}

export function assertDOMMutation(...targets: Node[]) {
  const TIMEOUT = 1250
  return new Promise<void>(function (resolve) {
    let timeout: number

    /**
     * if DOM on a page keeps changing ex) chat
     * you should resolve it
     */
    window.setTimeout(resolve, 10000)

    const observer = new MutationObserver(function () {
      // const iframe = records
      //   .flatMap((r) => Array.from(r.addedNodes))
      //   .find((node) => node instanceof HTMLIFrameElement) as HTMLIFrameElement

      // if (!iframe || !iframe.contentDocument || !iframe.contentDocument.documentElement) return

      // observer.observe(iframe.contentDocument.documentElement, { subtree: true, childList: true, attributes: true })

      // console.log('records: ', records)

      window.clearTimeout(timeout)

      timeout = window.setTimeout(function () {
        observer.disconnect()
        resolve()
      }, TIMEOUT)
    })

    targets.forEach((t) => observer.observe(t, { subtree: true, childList: true, attributes: true }))
  })
}

export function assertRedirection() {
  return new Promise<void>(function (resolve, reject) {
    /**
     * wait to see on any redirection
     */
    window.setTimeout(resolve, 1000)
    window.addEventListener('beforeunload', reject, { once: true })
  })
}

export function createAppendingContainerWithRelativeCoordinates({
  target,
  direction = 'all',
  draggable = true,
  stackingFrame
}: {
  target: HTMLElement
  direction?: 'all' | 'vertical' | 'horizontal' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
  draggable?: boolean
  /**
   * stacking frame is the frame that appending container is located at in absolute position
   */
  stackingFrame: HTMLElement
}): HTMLDivElement {
  const iframe = getOwnerIframe(target)
  const offset = iframe?.getBoundingClientRect()

  const container = window.top!.document.createElement('div')
  const rect = target.getBoundingClientRect()

  const x = rect.x + (offset ? offset.x : 0)
  const y = rect.y + (offset ? offset.y : 0)

  /**
   * these below are length, not coordinate
   *
   * so judging the direction only accounts for margins in viewpoint which doesn't count how far It is scrolled
   */

  const marginLeft = x
  const marginTop = y
  const marginRight = document.documentElement.clientWidth - x - rect.width
  const marginBottom = document.documentElement.clientHeight - y - rect.height
  const padding = 5

  container.style.position = 'absolute'

  if (draggable) {
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

      if (container.style.top) container.style.top = `${parseFloat(/-?\d+/.exec(container.style.top)![0]) + dy}px`
      else container.style.bottom = `${parseFloat(/-?\d+/.exec(container.style.bottom)![0]) - dy}px`

      if (container.style.left) container.style.left = `${parseFloat(/-?\d+/.exec(container.style.left)![0]) + dx}px`
      else container.style.right = `${parseFloat(/-?\d+/.exec(container.style.right)![0]) - dx}px`
    }
  }

  stackingFrame.append(container)

  const frameRect = stackingFrame.getBoundingClientRect()

  switch (direction) {
    case 'bottomleft': {
      const top = y + rect.height - (rect.height > marginBottom ? rect.height - marginBottom : -padding)
      container.style.top = `${top > document.documentElement.clientHeight ? padding : top}px`
      container.style.left = `${x > document.documentElement.clientWidth ? padding : x}px`
      return container
    }

    case 'bottomright': {
      const top = y + rect.height - (rect.height > marginBottom ? rect.height - marginBottom : -padding)
      container.style.top = `${top > document.documentElement.clientHeight ? padding : top}px`
      const right = window.top!.document.documentElement.clientWidth - x
      container.style.right = `calc(100% - ${
        right > document.documentElement.clientWidth
          ? window.top!.document.documentElement.clientWidth - frameRect.width - padding
          : window.top!.document.documentElement.clientWidth - frameRect.width - right - padding
      }px)`
      return container
    }

    case 'topleft': {
      const bottom =
        window.top!.document.documentElement.clientHeight -
        // (window.top!.document.documentElement.clientHeight - parentHeight) -
        y
      // -(rect.height > marginTop ? rect.height - marginTop : -padding)
      container.style.bottom = `calc(100% - ${
        bottom > document.documentElement.clientHeight
          ? // you need to apply offset to the extent of the gap between client height(viewpoint height) and the parent's height
            // this minus means direction
            window.top!.document.documentElement.clientHeight - frameRect.height - padding
          : window.top!.document.documentElement.clientHeight - frameRect.height - bottom - padding
      }px)`
      container.style.left = `${x > document.documentElement.clientWidth ? padding : x}px`
      return container
    }

    case 'topright': {
      const bottom =
        window.top!.document.documentElement.clientHeight -
        // (window.top!.document.documentElement.clientHeight - parentHeight) -
        y
      // -(rect.height > marginTop ? rect.height - marginTop : -padding)
      container.style.bottom = `calc(100% - ${
        bottom > document.documentElement.clientHeight
          ? // you need to apply offset to the extent of the gap between client height(viewpoint height) and the parent's height
            // this minus means direction
            window.top!.document.documentElement.clientHeight - frameRect.height - padding
          : window.top!.document.documentElement.clientHeight - frameRect.height - bottom - padding
      }px)`
      const right = window.top!.document.documentElement.clientWidth - x
      container.style.right = `calc(100% - ${
        right > document.documentElement.clientWidth
          ? window.top!.document.documentElement.clientWidth - frameRect.width - padding
          : window.top!.document.documentElement.clientWidth - frameRect.width - right - padding
      }px)`
      return container
    }

    default: {
      break
    }
  }

  const cases: Array<number> = []

  switch (direction) {
    case 'all': {
      cases.push(marginLeft, marginTop, marginRight, marginBottom)
      break
    }
    case 'horizontal': {
      cases.push(marginLeft, marginRight)
      break
    }
    case 'vertical': {
      cases.push(marginTop, marginBottom)
      break
    }
    default: {
      break
    }
  }

  // switch (Math.max(...cases)) {
  //   /**
  //    * these css properties should be set in coordinates
  //    * offsetLeft : x coordinate including scroll factor
  //    *
  //    * this calculation is based on the prerequisite that the container is html document
  //    * to apply the coordinates computed to CSS
  //    */

  //   case marginLeft:
  //     container.style.top = `${target.offsetTop}px`
  //     container.style.right = `${document.documentElement.scrollWidth - target.offsetLeft - padding}px`
  //     break
  //   case marginTop:
  //     container.style.bottom = `${document.documentElement.scrollHeight - target.offsetTop + padding}px`
  //     container.style.left = `${target.offsetTop}px`
  //     break
  //   case marginRight:
  //     container.style.top = `${target.offsetTop}px`
  //     container.style.left = `${target.offsetLeft + rect.width + padding}px`
  //     break
  //   case marginBottom:
  //     container.style.top = `${target.offsetTop + rect.height + padding}px`
  //     container.style.left = `${target.offsetLeft}px`
  //     break
  //   default:
  //     break
  // }

  switch (Math.max(...cases)) {
    /**
     * these css properties should be set in coordinates
     *
     * this calculation is based on the specific container
     * which is fixed at left 0, top 0 width 0 widht, 0 height
     * so you can just use relative coordinate(viewpoint coordinate) to CSS properties
     */
    case marginLeft:
      container.style.top = `${y > document.documentElement.clientHeight ? padding : y}px`
      /**
       * if parent container's width is less than client width
       * you need to pull backward to the extent
       */
      const right =
        window.top!.document.documentElement.clientWidth -
        // (window.top!.document.documentElement.clientWidth - parentWidth) -
        x
      // -        (rect.width > marginLeft ? rect.width - marginLeft : -padding)

      /**
       * 100vh doesn't work don't know why yet
       * you need to minus from 100% to apply offset
       * because the axis on right property need to be located at the end of the right side
       */

      container.style.right = `calc(100% - ${
        right > document.documentElement.clientWidth
          ? window.top!.document.documentElement.clientWidth - frameRect.width - padding
          : window.top!.document.documentElement.clientWidth - frameRect.width - right - padding
      }px)`
      break
    case marginTop:
      const bottom =
        window.top!.document.documentElement.clientHeight -
        // (window.top!.document.documentElement.clientHeight - parentHeight) -
        y
      // -(rect.height > marginTop ? rect.height - marginTop : -padding)
      container.style.bottom = `calc(100% - ${
        bottom > document.documentElement.clientHeight
          ? // you need to apply offset to the extent of the gap between client height(viewpoint height) and the parent's height
            // this minus means direction
            window.top!.document.documentElement.clientHeight - frameRect.width - padding
          : window.top!.document.documentElement.clientHeight - frameRect.width - bottom - padding
      }px)`
      container.style.left = `${x > document.documentElement.clientWidth ? padding : x}px`
      break
    case marginRight:
      container.style.top = `${y > document.documentElement.clientHeight ? padding : y}px`
      const left = x + rect.width - (rect.width > marginRight ? rect.width - marginRight : -padding)
      container.style.left = `${left > document.documentElement.clientWidth ? padding : left}px`
      break
    case marginBottom:
      const top = y + rect.height - (rect.height > marginBottom ? rect.height - marginBottom : -padding)
      container.style.top = `${top > document.documentElement.clientHeight ? padding : top}px`
      container.style.left = `${x > document.documentElement.clientWidth ? padding : x}px`
      break
    default:
      break
  }

  return container
}

export function getOwnerIframe(target: HTMLElement): HTMLIFrameElement | undefined {
  const iframes = Array.from(window.top!.document.querySelectorAll('iframe'))
  return iframes.find((iframe) => iframe.contentDocument === target.ownerDocument)
}

export function getDocuments() {
  return [window.top?.document || document].concat(
    Array.from(document.querySelectorAll('iframe'))
      .map((i) => i.contentDocument)
      .filter((doc): doc is Document => !!doc)
  )
}

export function getChromeHeight() {
  return new Promise<number>(function (resolve) {
    const offset = window.screenY

    document.addEventListener(
      'mouseenter',
      function (e) {
        resolve(e.screenY - e.clientY - offset)
      },
      { once: true }
    )
  })
}

/**
 * this is for plural query
 */
export function recursiveExtractStructure(ele: HTMLElement, depth?: number, classSelector: boolean = true): string {
  /**
   * extracting id prevents multiple elements from being selected
   * which is not what most users want
   */
  // if (ele.id) return ele.id
  const tag = ele.nodeName.toLowerCase()

  /**
   * sometimes classList changes after extracting
   * ex) naver cafe body classList changes on esc key
   * so if you pushs esc while extracting It can lead to wrong result
   */

  let selector: string = tag

  if (classSelector && tag !== 'html' && tag !== 'body') {
    const classSequence = Array.from(ele.classList)
      .map((clsName) => `.${clsName}`)
      .filter((clsSelector) => !REG_CSS_SELECTOR_META_CHARACTER.test(clsSelector))
      .join('')

    selector += classSequence
  }

  // const selector = `${tag}`
  if (!ele.parentElement || depth === 0) return selector

  return `${recursiveExtractStructure(
    ele.parentElement,
    depth !== undefined ? depth - 1 : depth,
    classSelector
  )} > ${selector}`
}

/**
 * this is for singular query
 */
export function recursiveExtractSelector(ele: HTMLElement, depth?: number): string {
  if (ele.id) return `#${ele.id}`
  if (!ele.parentElement || depth === 0) return ele.tagName.toLowerCase()

  const index = Array.from(ele.parentElement.children).indexOf(ele) + 1
  return `${recursiveExtractSelector(
    ele.parentElement,
    depth !== undefined ? depth - 1 : depth
  )} > ${ele.tagName.toLowerCase()}:nth-child(${index})`
}

export function extractClass(ele: HTMLElement) {
  return `${ele.tagName.toLowerCase()}${Array.from(ele.classList)
    .map((clsName) => `.${clsName}`)
    .filter((clsSelector) => !REG_CSS_SELECTOR_META_CHARACTER.test(clsSelector))
    .join('')}`
}

export function extractSelector(ele: HTMLElement): string {
  if (ele.id) return `#${ele.id}`

  if (!ele.parentElement)
    return `${ele.tagName.toLowerCase()}${Array.from(ele.classList)
      .map((clsName) => `.${clsName}`)
      .filter((clsSelector) => !REG_CSS_SELECTOR_META_CHARACTER.test(clsSelector))
      .join('')}`

  return `${extractSelector(ele.parentElement)} > ${ele.tagName.toLowerCase()}${Array.from(ele.classList)
    .map((clsName) => `.${clsName}`)
    .filter((clsSelector) => !REG_CSS_SELECTOR_META_CHARACTER.test(clsSelector))
    .join('')}`
}

export function getPedigree(ele: HTMLElement): Array<HTMLElement> {
  const pedigree = [ele]
  if (!ele.parentElement || ele.parentElement === document.body) return pedigree
  return pedigree.concat(getPedigree(ele.parentElement))
}

export function getNextDescendingNode(ele: Element): Element | null {
  if (!ele.parentElement) return null
  if (!ele.parentElement.nextElementSibling) return getNextDescendingNode(ele.parentElement)
  return ele.parentElement.nextElementSibling
}

export function getDescendantNode(ele: Element): Element {
  if (!ele.lastElementChild) return ele
  return getDescendantNode(ele.lastElementChild)
}

export function findCommonAscendant(a: HTMLElement, b: HTMLElement) {
  const pa = getPedigree(a)
  const pb = getPedigree(b)

  // if (pa[0] !== pb[0]) return null

  const longer = [pa, pb].reduce((prev, curr) => (curr.length > prev.length ? curr : prev))
  const shorter = [pa, pb].find((p) => p !== longer)!

  const commonAscendant = shorter.find((ele) => longer.includes(ele))

  console.log(
    `finding common ascendant;\na : ${pa.map((ele) => ele.tagName)}\nb : ${pb.map((ele) => ele.tagName)}\ncommon : ${
      commonAscendant?.tagName
    }`
  )

  return commonAscendant
}

export function assertOverlay(ownerDocument: Document, overlayId: string) {
  let ol = ownerDocument.querySelector(`#${overlayId}`) as HTMLDivElement
  if (!ol) {
    ol = ownerDocument.createElement('div') as HTMLDivElement
    ol.setAttribute('id', overlayId)
    ol.style.position = 'absolute'
    ol.style.top = '0'
    ol.style.left = '0'
    ol.style.pointerEvents = 'none'
    ol.style.zIndex = '2147483646'

    ownerDocument.body.append(ol)
  }
  return ol
}

export function createOverlayMaskOn(
  // ownerDocument: Document,
  // ol: HTMLElement,
  target: HTMLElement,
  overlayId: string
) {
  const { top, left, width, height } = target.getBoundingClientRect()
  const ol = assertOverlay(target.ownerDocument, overlayId)
  const mask = target.ownerDocument.createElement('div')
  mask.style.position = 'absolute'
  mask.style.top = `${
    top + (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollTop : 0)
  }px`
  mask.style.left = `${
    left + (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollLeft : 0)
  }px`
  mask.style.width = `${width}px`
  mask.style.height = `${height}px`
  mask.style.boxSizing = 'border-box'

  ol.append(mask)
  return mask
}
