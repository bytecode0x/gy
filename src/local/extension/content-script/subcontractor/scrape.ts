import { __Action__Scrape } from 'local/desktop/main/gy/type/action.preset'
import { z } from 'zod'

export function structurize(items: __Action__Scrape['schema']['items']): __Action__Scrape['returnType'] {
  return items
    .filter((i) => i.target)
    .reduce(function (prev, curr) {
      const elementMatrix = getFilteredElementMatrix(items, curr)
      return Object.assign(prev, {
        [curr.name]: elementMatrix.map((elements) =>
          elements.map(function (ele) {
            switch (curr.target) {
              case 0b1:
                return ele.innerText?.trim() || ''

              case 0b10:
                const href = ele.getAttribute('href')
                return href
                  ? href.startsWith('/')
                    ? `${(ele.ownerDocument.defaultView || window).location.origin}${href}`
                    : href
                  : ''

              case 0b100:
                const src = ele.getAttribute('src') || ele.getAttribute('data-src')
                return src
                  ? src.startsWith('/')
                    ? `${(ele.ownerDocument.defaultView || window).location.origin}${src}`
                    : src
                  : ''

              default:
                throw new Error('FORWARDED_SCRAPE:INVALID_TARGET')
            }
          })
        ),
        [`${curr.name}$html`]: elementMatrix.map((elements) => elements.map((ele) => ele.outerHTML))
      })
    }, {})
}

export function getElements(item: __Action__Scrape['schema']['items'][number]): Array<HTMLElement> {
  return item.query.flatMap(function ({ selector, frame, exclusions }) {
    if (!frame)
      return Array.from(document.querySelectorAll(selector)).filter(
        (_, index) => !exclusions.includes(index)
      ) as Array<HTMLElement>

    const doc = ((window.top?.document || document).querySelector(frame) as HTMLIFrameElement)?.contentDocument
    // if (!doc) throw new Error('DESIGNER:SCRAPE:GET_ELEMENTS:NO_FRAME_MATCHED')
    if (!doc) return []
    return Array.from(doc.querySelectorAll(selector)).filter(
      (_, index) => !exclusions.includes(index)
    ) as Array<HTMLElement>
  })
}

/**
 * get 2 dimensional html elements array filtered by groups
 */
export function getFilteredElementMatrix(
  items: __Action__Scrape['schema']['items'],
  item: __Action__Scrape['schema']['items'][number]
): Array<Array<HTMLElement>> {
  const list: __Action__Scrape['schema']['items'] = []
  let curr: __Action__Scrape['schema']['items'][number] | undefined = item

  while (curr) {
    list.push(curr)
    // eslint-disable-next-line no-loop-func
    curr = items.find((i) => i.id === curr?.group)
  }
  // array of elements sorted in group order
  const matrix = list.reverse().map((i) => getElements(i))

  /**
   * you need to reduce it except the last array which is the actual target elements
   * to make it into 2 dimensional array
   * initial value for matrix[0] in case that matrix has only one item
   * you need to filter even though it has no groups to make it into matrix
   */

  const parents = matrix.slice(0, matrix.length - 1).reduce(function (prev, curr) {
    return prev.flatMap((p) => curr.filter((c) => p.contains(c)))
  }, matrix[0])

  const children = matrix[matrix.length - 1]

  const filteredMatrix = parents.map((p) => children.filter((c) => p.contains(c)))

  // console.log('filteredMatrix : ', filteredMatrix)

  return filteredMatrix as Array<Array<HTMLElement>>
}

export function getUrls(ele: HTMLElement) {
  const schema = z.string().url()
  return Array.from(ele.attributes)
    .map((attr) => attr.value)
    .filter((v) => schema.safeParse(v).success)
}
