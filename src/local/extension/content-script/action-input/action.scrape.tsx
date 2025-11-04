import DottedRectangle from 'lib/asset/svg/DottedRectangle'
import URLLink from 'lib/asset/svg/Link'
import List3 from 'lib/asset/svg/List3'
import Minus from 'lib/asset/svg/Minus'
import NumberOne from 'lib/asset/svg/NumberOne'
import Pagination2 from 'lib/asset/svg/Pagination2'
import Picture from 'lib/asset/svg/Picture'
import Plus from 'lib/asset/svg/Plus'
import Scroll from 'lib/asset/svg/Scroll'
import TextFormat from 'lib/asset/svg/TextFormat'
import FormComponent from 'lib/component/Form'
import {
  Abbr,
  Colgroup,
  Column,
  Div,
  FlexCenterDiv,
  FlexColumnDiv,
  FlexDiv,
  Input,
  Label,
  Option,
  SVGButton,
  Select,
  TableBody,
  TableData,
  TableHeader,
  TableRow
} from 'lib/frame/generic'
import { ElevatedButton, ElevatedForm, EllipticalAbbr, EllipticalLabel, RecordItem } from 'lib/frame/sementic'
import { DataRecord } from 'lib/gy/core/type/primitive'
import { getRandomColor } from 'lib/util/common'
import {
  createAppendingContainerWithRelativeCoordinates,
  extractClass,
  extractSelector,
  getDescendantNode,
  getNextDescendingNode,
  getOwnerIframe,
  recursiveExtractSelector,
  recursiveExtractStructure
} from 'lib/util/dom/common'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__Scrape } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { HTMLItem } from 'type/app'
import { v4 } from 'uuid'
import OverlayForm from '../components/OverlayForm'
import StringInput from '../components/StringInput'
import SubstituteNameInput from '../components/SubstituteNameInput/SubstituteNameInput'
import { SNAPSHOT_MAX_COL_LENGTH, SNAPSHOT_MAX_DATA_LENGTH, SNAPSHOT_MAX_ROW_LENGTH } from '../const'
import { OverlayInput, OverlayLabel, SVGCheckBox, SpecificationTable } from '../frames'
import { displayUI, getPreviousSnapshots, getUpperSnapshots, removeUI, stringifyData } from '../functions'
import { getAppContainer, safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { getFilteredElementMatrix } from '../subcontractor/scrape'
import { ActionInput } from './type'

const Container = styled(FlexColumnDiv)`
  align-items: stretch;
  padding: 4px;

  & > * {
    margin-top: 6px;
  }
`
const UtilityButton = styled(SVGButton)``

const Item = styled(RecordItem)``

const CommonProperties = styled(FlexCenterDiv)`
  & svg {
    height: 16px;
    aspect-ratio: 1;
  }

  & > * {
    width: 32px;
    height: 32px;
    padding: var(--padding-default);
    position: relative;
    border-radius: var(--border-radius-default);
  }

  & > *:not(:empty) {
    margin-left: 2px;
  }
`

const SVGLabel = styled(Label)`
  cursor: pointer;

  & > svg {
    width: var(--svg-size-nav);
    height: var(--svg-size-nav);
    color: var(--color-text-primary);
  }
`

const SelectorContainer = ElevatedForm

const TargetOption = styled(FlexDiv)`
  width: 600px;
  align-items: center;

  margin-top: 10px;
`

const TargetButton = styled(ElevatedButton)`
  margin-right: 6px;
`

const TargetSample = styled(Abbr)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const Separator = styled(Div)`
  border-top: 1px solid var(--color-border-base);
  margin-top: 10px;
`

const AdvancedOptionsContainer = styled(FlexCenterDiv)`
  position: fixed;
  bottom: 1em;
  right: 1em;
  align-items: stretch;

  & > * {
    font-size: 1em;
    margin: 6px;
  }
`

const SelectorDepth = styled(Input)`
  width: 50px;
  border: 1px solid rgb(133, 133, 133);
  text-align: center;

  &::placeholder {
    font-size: 1em;
    color: black;
  }

  &[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`

export const SCRAPE: ActionInput<__Action__Scrape> = {
  // name: 'Scrape',
  template: 'SCRAPE',
  // req: ['binding-tab'],
  help: '수집하고자 하는 요소를 마우스로 클릭하세요\n수집되는 요소들은 빨간 테두리로 표시됩니다',
  design({ as }) {
    const [mode, setMode] = useState<'select_target' | 'select_pagination' | 'normal'>('normal')
    const [selectorContainer, setSelectorContainer] = useState<HTMLDivElement | null>(null)
    const [selectedItem, setSelectedItem] = useState<__Action__Scrape['schema']['items'][number] | null>(null)
    const [pinned, setPinned] = useState<boolean>(true)

    /**
     * 모드에 따라 effect 를 이용해 listeners 의 등록/제거 컨트롤
     * => effect invoking 을 위해 리렌더해야하므로 state를 써야 함
     * 나머지 변수에 대해서 state 로 처리하면 너무 잦은 렌더링 및 함수 재생성, 이벤트 리스너 등록 등
     * 코스트가 커지므로 렌더링을 필요로하지 않는 변수들은 ref 로 처리
     */

    /**
     * items(substitutes) should be managed in state?
     */

    const roots = useRef<Array<HTMLElement>>(
      [window.top?.document.documentElement || document.documentElement].concat(
        Array.from(document.querySelectorAll('iframe'))
          .map((i) => i.contentDocument)
          .filter((doc): doc is Document => doc !== null)
          .map((doc) => doc.documentElement)
      )
    )
    const current = useRef<HTMLElement | null>(null)
    const select = useRef<Array<HTMLElement>>([])
    const query = useRef<__Action__Scrape['schema']['items'][number]['query']>([])
    const hover = useRef<Array<HTMLElement>>([])
    const family = useRef<Array<Array<HTMLElement>>>([])
    // const selector = useRef<Array<string>>([])
    const borderColor = useRef<string>('')
    const plural = useRef<boolean | undefined>(undefined)
    const groups = useRef<Array<HTMLElement>>(roots.current)
    const groupItemId = useRef<string>('')
    const selectorDepth = useRef<number>()
    const elementNumber = useRef<number>()
    const classSelector = useRef<boolean>(true)
    // const pagination = useRef<Partial<Scrape['value']['pagination']>>({})
    const snapshot = useRef<DataRecord>(
      (function () {
        const { cache, setState } = getStore().getState()

        const ps = cache.procedures.find((ps) => ps.tasks.flat().some((ts) => ts.actions.includes(as)))

        if (!ps) {
          pushMessage({
            message: 'DESIGNER:SCRAPE:NO_PROC_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })
          throw new Error('DESIGNER:SCRAPE:NO_PROC_SCHEMA_MATCHED')
        }
        const ts = ps.tasks.flat().find((ts) => ts.actions.includes(as))

        if (!ts) {
          pushMessage({
            message: 'DESIGNER:SCRAPE:NO_TASK_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })
          throw new Error('DESIGNER:SCRAPE:NO_TASK_SCHEMA_MATCHED')
        }

        const snapshot = getUpperSnapshots(ps, ts)
          .concat(getPreviousSnapshots(ts, as))
          .reduce(function (prev, curr) {
            return Object.assign(prev, curr)
          }, {})

        return snapshot
      })()
    ).current

    const resetPseudoState = useCallback(function () {
      select.current = []
      query.current = []
      hover.current = []
      family.current = []
      // selector.current = []
      borderColor.current = ''
      plural.current = undefined
      selectorDepth.current = undefined
      elementNumber.current = undefined
      classSelector.current = true
      // groupItemId.current = ''
    }, [])

    const assertBorderOverlay = useCallback(function (ownerDocument: Document) {
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
    }, [])

    const drawOverlayBorder = useCallback(function (
      // ownerDocument: Document,
      // ol: HTMLElement,
      target: HTMLElement,
      border: string
    ) {
      const { top, left, width, height } = target.getBoundingClientRect()
      const ol = assertBorderOverlay(target.ownerDocument)
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
    }, [])

    const createFamily = useCallback(function (ele: HTMLElement) {
      // if (!plural.current) return []
      const selector =
        plural.current === true
          ? recursiveExtractStructure(ele, selectorDepth.current, classSelector.current)
          : recursiveExtractSelector(ele, selectorDepth.current)
      return Array.from(ele.ownerDocument.querySelectorAll(selector)).filter((ele) =>
        groups.current.some((g) => g.contains(ele))
      ) as Array<HTMLElement>
    }, [])

    const createHover = useCallback(function (ele: HTMLElement) {
      // if (!plural.current) return []
      const selector =
        plural.current === true
          ? recursiveExtractStructure(ele, selectorDepth.current, classSelector.current)
          : recursiveExtractSelector(ele, selectorDepth.current)

      return Array.from(ele.ownerDocument.querySelectorAll(selector)).slice(
        0,
        elementNumber.current === undefined ? undefined : elementNumber.current > 1 ? elementNumber.current - 1 : 0
      ) as Array<HTMLElement>
    }, [])

    const handleMouseover = useCallback(
      function (this: HTMLElement, e: MouseEvent) {
        e.stopPropagation()
        if (!e.target) return

        switch (mode) {
          case 'select_target':
            // erase
            roots.current
              .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-hover]')))
              .forEach((s) => s.remove())

            hover.current = createHover(e.target as HTMLElement)
            hover.current
              ?.filter((f) => groups.current.some((g) => g.contains(f)))
              .forEach((ele) =>
                drawOverlayBorder(ele, `1px dotted ${borderColor.current}`).setAttribute('data-gatsby-hover', 'true')
              )
            break
          case 'select_pagination':
            // erase
            roots.current
              .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-hover]')))
              .forEach((s) => s.remove())

            hover.current = createHover(e.target as HTMLElement)
            if ((e.target as HTMLElement).tagName.toLowerCase() !== 'a') return

            hover.current.forEach((ele) =>
              drawOverlayBorder(ele, `1px dotted ${borderColor.current}`).setAttribute('data-gatsby-hover', 'true')
            )
            break

          default:
        }
      },
      [mode]
    )

    const handleKey = useCallback(
      async function (this: HTMLElement, e: KeyboardEvent) {
        switch (e.key) {
          case 'Escape': {
            if (mode === 'select_pagination' && as.value.pagination === undefined) {
              ;(safeGetBody().querySelector('#pagination') as HTMLInputElement).checked = false
            }

            setSelectorContainer(null)
            return setMode('normal')
          }
          case 'ArrowUp': {
            if (!current.current) return
            e.preventDefault()
            if (e.target instanceof HTMLElement && !getAppContainer().contains(e.target)) {
              e.stopPropagation()
            }
            const _current =
              [
                current.current.previousElementSibling && getDescendantNode(current.current.previousElementSibling),
                current.current.parentElement
              ].find((ele) => groups.current.some((g) => g.contains(ele))) || current.current

            current.current = _current as HTMLElement
            // family.current = createFamily(select.current)
            break
          }
          case 'ArrowDown': {
            if (!current.current) return
            e.preventDefault()
            if (e.target instanceof HTMLElement && !getAppContainer().contains(e.target)) {
              e.stopPropagation()
            }
            const _current =
              [
                current.current.firstElementChild,
                current.current.nextElementSibling,
                getNextDescendingNode(current.current)
              ].find((ele) => groups.current.some((g) => g.contains(ele))) || current.current

            current.current = _current as HTMLElement
            // family.current = createFamily(select.current)
            break
          }
          default: {
            return
          }
        }

        select.current.pop()
        select.current.push(current.current)

        query.current.pop()
        const frame = getOwnerIframe(current.current)
        query.current.push({
          // selector: recursiveExtractStructure(current.current),
          selector: plural.current
            ? recursiveExtractStructure(current.current, selectorDepth.current, classSelector.current)
            : recursiveExtractSelector(current.current, selectorDepth.current),
          frame: frame && extractSelector(frame),
          exclusions: []
        })

        const currentFamily = createFamily(current.current)
        family.current.pop()
        family.current.push(currentFamily)

        // erase previous select border
        roots.current
          .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-select], [data-gatsby-family]')))
          .forEach((s) => s.remove())

        // set, draw select
        select.current.forEach((s) =>
          drawOverlayBorder(s, `3px solid ${borderColor.current}`).setAttribute('data-gatsby-select', 'true')
        )

        // // set, draw family

        family.current.forEach((f) =>
          f
            .filter((ele) => groups.current.some((g) => g.contains(ele)))
            .forEach((ele) =>
              drawOverlayBorder(ele, `2px dotted ${borderColor.current}`).setAttribute('data-gatsby-family', 'true')
            )
        )

        const appendingContainer = createAppendingContainerWithRelativeCoordinates({
          target: current.current,
          stackingFrame: safeGetBody().querySelector('#gatsby-frame') as HTMLDivElement
        })

        setSelectorContainer(appendingContainer)
      },
      [mode]
    )

    const handleClick = useCallback(
      async function (this: HTMLElement, e: MouseEvent) {
        if (document.querySelector('#gatsby-root')?.contains(e.target as HTMLElement)) return
        e.preventDefault()

        if (!e.currentTarget || !e.target) return

        /**
         * you need to prevent the callbacks in the web page from invoking
         */
        e.stopImmediatePropagation()

        /**
         * todo
         * 1. create an appending container by the target
         * 2. render selectors into it
         * 3. wrap it up with Promise that resolves on selections
         *
         * requirement
         * 1. user can be able to go back and forth between selectors
         * => which needs state to remember current stage
         * => which can be done possibly with the portal or creating another root
         * => but It seems better do with vanila js
         *
         * result
         * 1. you can't put appending container on fixed layer
         * because you get to use absolute coordinates as relative coordinates
         * 2. and you can't put it on outside of gatsby app
         * because of css and pointer events issue
         *
         * solution
         * 1. design another function that computes appending container's coordinates in relative
         * 2. put the container in layer in window size
         */

        switch (mode) {
          case 'select_target':
            if (!groups.current.some((g) => g.contains(e.target as HTMLElement))) return

            /**
             * if current target is parent of select or family
             * you should skip and pass event down to descendants
             */
            // if (
            //   e.ctrlKey &&
            //   (select.current.some((s) => (e.currentTarget as HTMLElement).contains(s)) ||
            //     family.current.some((f) => f.some((ele) => (e.currentTarget as HTMLElement).contains(ele))))
            // )
            //   return

            /**
             * current target is select or family
             */
            // e.stopImmediatePropagation()

            /**
             * you can't deal with adding or removing problem with currentTarget
             * because you need to call stopImmediatePropagation at first to prevent other callbacks from invoking
             * and that means you always get currentTarget as upmost element
             *
             * maybe you can improve in the way that adding additional callbacks on select and family elements
             */

            if (!plural.current) {
              select.current.pop()
              family.current.pop()
              query.current.pop()
              current.current = e.target as HTMLElement
              select.current.push(current.current)
              family.current.push(createFamily(current.current))
              const frame = getOwnerIframe(current.current)
              query.current.push({
                selector: recursiveExtractSelector(current.current, selectorDepth.current),
                frame: frame && extractSelector(frame),
                exclusions: []
              })
            } else if (e.ctrlKey && select.current.some((s) => s.contains(e.target as HTMLElement))) {
              const index = select.current.findIndex((s) => s === e.target)!

              select.current.splice(index, 1)
              query.current.splice(index, 1)
              family.current.splice(index, 1)
              current.current = select.current[select.current.length - 1]
            } else if (
              e.ctrlKey &&
              family.current.some((f) => f.some((ele) => ele.contains(e.target as HTMLElement)))
            ) {
              const row_index = family.current.findIndex((f) => f.includes(e.target as HTMLElement))!
              const col_index = family.current[row_index].findIndex((ele) => ele.contains(e.target as HTMLElement))!

              if (query.current[row_index].exclusions.includes(col_index))
                query.current[row_index].exclusions = query.current[row_index].exclusions.filter((v) => v !== col_index)
              else query.current[row_index].exclusions.push(col_index)

              // const [removal] = family.current[row_index].splice(col_index, 1)

              // const s = select.current[row_index]

              // /**
              //  * you need to consider to extract common selector among the rest elements
              //  * not just the order of the removing element
              //  */
              // const commonAscendant = findCommonAscendant(s, removal)!
              // const commonSelector = recursiveExtractStructure(commonAscendant).split(/\s*>\s*/g)

              // const exclusion_index = Array.from(commonAscendant.children).findIndex((c) => c.contains(removal))

              // const selector = query.current[row_index].selector.split(/\s*>\s*/g)

              // // console.log('exclusion index : ', exclusion_index)
              // // console.log('common ascendant : ', commonAscendant)

              // selector.splice(
              //   commonSelector.length,
              //   1,
              //   `${selector[commonSelector.length]}:not(:nth-child(${exclusion_index + 1}))`
              // )

              // const frame = getOwnerIframe(e.target as HTMLElement)
              // query.current.splice(row_index, 1, {
              //   selector: selector.join(' > '),
              //   frame: frame && extractSelector(frame)
              // })
            } else if (e.ctrlKey) {
              current.current = e.target as HTMLElement
              select.current.push(current.current)
              family.current.push(createFamily(current.current))

              const frame = getOwnerIframe(current.current)
              query.current.push({
                selector: recursiveExtractStructure(current.current, selectorDepth.current, classSelector.current),
                frame: frame && extractSelector(frame),
                exclusions: []
              })
            } else {
              select.current.pop()
              family.current.pop()
              query.current.pop()
              current.current = e.target as HTMLElement
              select.current.push(current.current)
              family.current.push(createFamily(current.current))
              const frame = getOwnerIframe(current.current)
              query.current.push({
                selector: recursiveExtractStructure(current.current, selectorDepth.current, classSelector.current),
                frame: frame && extractSelector(frame),
                exclusions: []
              })
            }

            // erase previous select border
            roots.current
              .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-select], [data-gatsby-family]')))
              .forEach((s) => s.remove())
            // roots.current
            //   .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-family]')))
            //   .forEach((s) => s.remove())

            // set, draw select
            select.current.forEach((s) =>
              drawOverlayBorder(s, `3px solid ${borderColor.current}`).setAttribute('data-gatsby-select', 'true')
            )

            // // set, draw family
            // family.current = createFamily(e.target as HTMLElement)

            family.current.forEach((f, row_index) =>
              f
                .filter((ele) => groups.current.some((g) => g.contains(ele)))
                .forEach(
                  (ele, col_index) =>
                    !query.current[row_index].exclusions.includes(col_index) &&
                    drawOverlayBorder(ele, `2px dotted ${borderColor.current}`).setAttribute(
                      'data-gatsby-family',
                      'true'
                    )
                )
            )

            if (!current.current) return setSelectorContainer(null)
            const appendingContainer = createAppendingContainerWithRelativeCoordinates({
              target: current.current,
              stackingFrame: safeGetBody().querySelector('#gatsby-frame') as HTMLDivElement
            })

            // const layer = (e.target as HTMLElement).ownerDocument.querySelector('#gatsby-border-ol') as HTMLDivElement
            setSelectorContainer(appendingContainer)
            break
          case 'select_pagination': {
            if ((e.target as HTMLElement).tagName.toLowerCase() !== 'a') return
            /**
             * todo
             * 1.screenshot examples
             * => naver cafe(several indexes), jav(one index and prev, next buttons)
             * 2.pagination borders should be all same for each other
             */
            const anchor = e.target as HTMLAnchorElement
            const selector = extractSelector(anchor)
            const frame = window.top!.document.documentElement.contains(e.target as HTMLElement)
              ? undefined
              : extractSelector(
                  Array.from(window.top!.document.querySelectorAll('iframe')).find((i) =>
                    i.contentDocument?.contains(anchor)
                  )!
                )
            // const end = window.prompt('몇 페이지까지 수집할 것인지 인덱스를 입력해주세요') || undefined

            /**
             * analyze on pagination here
             * - prerequisite
             * 1. pagination through anchor element
             * 2. text content of the anchor is same with the index
             * => or at least the index in url is number
             */

            // extract pattern
            const indexes = createFamily(anchor) as Array<HTMLAnchorElement>

            const paramsList = indexes.map((index) => Object.fromEntries(new URL(index.href).searchParams))

            const keys = Array.from(new Set(paramsList.flatMap((params) => Object.keys(params))))
              .filter((key) => paramsList.every((params) => /^\d+$/.test(params[key])))
              .filter((key) => !paramsList.every((params) => params[key] === paramsList[0][key]))

            let paramKey: string | undefined

            if (keys.length === 1) {
              ;[paramKey] = keys
            }

            const pathnamesList = indexes.map((index) => new URL(index.href).pathname.split('/'))
            const pathIndex = `${pathnamesList[0].findIndex(
              (pathname, index) => !pathnamesList.every((pathnames) => pathname === pathnames[index])
            )}`

            if (!paramKey && !pathIndex) {
              return pushMessage({
                message: '올바른 대상이 아닙니다\n인덱스(숫자)가 적혀있는 버튼을 선택해주세요',
                autoRemove: true,
                layer: safeGetBody().querySelector('#push')
              })
            }

            /**
             * todo :
             * analysis and form should be processed as user interactions going
             * 1. push message that instructs to select current index anchor
             * 2. render hovering container that instructs to select the button to navigate next page
             * 3. if analyzed successfully, then hover the form that takes start, end index
             */

            setOverlay(
              <FormComponent
                record={{
                  '시작 인덱스': {
                    data: '1',
                    modal(getter, setter, close) {
                      return (
                        <StringInput
                          initial={getter()}
                          snapshot={snapshot}
                          placeholder='시작 인덱스를 입력해주세요'
                          onReject={close}
                          onResolve={function (raw, evaluted) {
                            setter(raw)
                            close()
                          }}
                        />
                      )
                    }
                    // effect(getter, setter) {
                    //   const start = window.prompt(
                    //     '수집 시작 페이지 인덱스를 입력해주세요\n빈칸 입력시 첫 페이지부터 수집합니다'
                    //   )
                    //   if (start) setter(start)
                    // }
                  },
                  '끝 인덱스': {
                    modal(getter, setter, close) {
                      return (
                        <StringInput
                          initial={getter()}
                          snapshot={snapshot}
                          placeholder='끝 인덱스를 입력해주세요'
                          onReject={close}
                          onResolve={function (raw, evaluted) {
                            setter(raw)
                            close()
                          }}
                        />
                      )
                    }
                    // effect(getter, setter) {
                    //   const end = window.prompt(
                    //     '수집 끝 페이지 인덱스를 입력해주세요\n빈칸 입력시 마지막 페이지까지 수집합니다'
                    //   )
                    //   if (end) setter(end)
                    // }
                  }
                }}
                header='페이지네이션 인덱스(페이지 번호) 값을 입력하세요'
                onReject={function () {
                  setOverlay(null)
                }}
                onResolve={function (formData) {
                  as.value.pagination = {
                    selector,
                    frame,
                    paramKey,
                    pathIndex,
                    start: formData['시작 인덱스'],
                    end: formData['끝 인덱스']
                  }
                  ;(safeGetBody().querySelector('#pagination') as HTMLInputElement).checked = true
                  setOverlay(null)
                  setMode('normal')
                }}
              />
            )

            // const start = window.prompt('수집 시작 페이지 인덱스를 입력해주세요\n빈칸 입력시 첫 페이지부터 수집합니다')
            // if (start === null) return
            // const end = window.prompt('수집 끝 페이지 인덱스를 입력해주세요\n빈칸 입력시 마지막 페이지까지 수집합니다')
            // if (end === null) return

            // as.value.pagination = { selector, frame, paramKey, pathIndex, start, end }
            // ;(safeGetBody().querySelector('#pagination') as HTMLInputElement).checked = true
            // setMode('normal')

            break
          }
          default:
        }
      },
      [mode]
    )

    const timeout = useRef<any>()
    const relocateAppendingContainer = useCallback(function (this: Document | Window) {
      if (pinned) return
      window.clearTimeout(timeout.current)
      timeout.current = window.setTimeout(function () {
        if (!current.current) return
        const appendingContainer = createAppendingContainerWithRelativeCoordinates({
          target: current.current,
          stackingFrame: safeGetBody().querySelector('#gatsby-frame') as HTMLDivElement
        })
        setSelectorContainer(appendingContainer)
      }, 120)
    }, [])

    /**
     * dealing with effect in useEffect seems like good idea
     * but if you want to draw and clean border in useEffect
     * then you should re-render then you should make it in state
     * which have to remake functions that use the state in function body
     * which leads to repetition of register and remove on event listener at every render
     * which is quite heavy cost
     *
     * so you need to find out how to draw and clean border
     * without renewing the event listeners
     */
    useEffect(
      function handleSelector() {
        /**
         * rendering selector better be done in component
         * because It's easier when you need state for itself
         */
        return function removePrevious() {
          selectorContainer?.remove()
        }
      },
      [selectorContainer]
    )

    useEffect(
      function registerListeners() {
        /**
         * - problem
         * 1. I need to get events in capturing phase to block default actions and other callback being invoked
         * 2. It effects to gatsby-app which is rendered into shadow root of an element of a document
         * which is capturing the events before the app
         * - solution
         * 1. not stopping propagation if event target is of the app
         */
        if (mode === 'normal') return
        window.addEventListener('resize', relocateAppendingContainer)
        document.addEventListener('scroll', relocateAppendingContainer)
        roots.current.forEach(function (root) {
          root.addEventListener('keydown', handleKey, { capture: true })
          root.addEventListener('mouseover', handleMouseover, { capture: true })
          root.addEventListener('click', handleClick, { capture: true })
        })

        return function removeListeners() {
          window.removeEventListener('resize', relocateAppendingContainer)
          document.removeEventListener('scroll', relocateAppendingContainer)
          roots.current.forEach(function (root) {
            root.removeEventListener('keydown', handleKey, { capture: true })
            root.removeEventListener('mouseover', handleMouseover, { capture: true })
            root.removeEventListener('click', handleClick, { capture: true })
          })
        }
      },
      [mode]
    )

    useEffect(
      function handleState() {
        if (mode === 'normal') resetPseudoState()
      },
      [mode]
    )

    useEffect(
      function draw() {
        switch (mode) {
          case 'normal': {
            const target = as.value.items.map((item) => [
              item,
              getFilteredElementMatrix(as.value.items, item).flat()
            ]) as Array<[HTMLItem, Array<HTMLElement>]>

            console.log('drawing: ', target)

            target.forEach(([item, elements]) =>
              elements.forEach((ele) =>
                drawOverlayBorder(ele, `2px ${item.target ? 'solid' : 'dotted'} ${item.borderColor}`)
              )
            )

            break
          }
          case 'select_target': {
            const gi = as.value?.items.find((i) => i.id === groupItemId.current)

            /**
             * if you use guard clause here, erase function won't invoke
             */
            if (gi) {
              groups.current = getFilteredElementMatrix(as.value.items, gi).flat()

              groups.current.forEach((ge) =>
                drawOverlayBorder(ge, `1px dotted ${gi.borderColor}`).setAttribute(`data-gatsby-group`, 'true')
              )
            }
            break
          }
          default:
            break
        }
        return function erase() {
          ;[window.top?.document.documentElement || document.documentElement]
            .concat(
              Array.from(document.querySelectorAll('iframe'))
                .map((i) => i.contentDocument)
                .filter((doc): doc is Document => !!doc)
                .map((doc) => doc.documentElement)
            )
            .forEach((doc) => doc.querySelector('#gatsby-border-ol')?.remove())
        }
      },
      [mode, as.value?.items.length]
    )

    useEffect(
      function handleUI() {
        switch (mode) {
          case 'normal':
            displayUI()
            break
          case 'select_target':
            removeUI()
            break
          case 'select_pagination':
            removeUI()
            break
          default:
            break
        }
      },
      [mode]
    )

    useEffect(
      function help() {
        switch (mode) {
          case 'normal':
            break
          case 'select_target':
            break
          case 'select_pagination':
            pushMessage({
              message: '페이지네이션 인덱스(숫자)가 모두 표시되도록 선택해주세요',
              autoRemove: true,
              layer: safeGetBody().querySelector('#push')
            })
            break
          default:
            break
        }
      },
      [mode]
    )

    useEffect(
      function log() {
        console.log('scrape designer rendered: ', as)
      },
      [mode]
    )

    useEffect(
      function addDragListenerOnSelectorContainer() {
        if (!selectorContainer) return

        return function () {
          selectorContainer.ondragstart = null
          selectorContainer.ondragend = null
        }
      },
      [selectorContainer]
    )

    /**
     * these below invoke an error at 1688
     * Uncaught EvalError: Refused to evaluate a string as JavaScript
     * because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive:
     * "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' http://localhost:* http://127.0.0.1:*".
     */

    // const f = new Function(
    //   /{\s*(?<body>.*)\s*}$/.exec(
    //     function () {
    //       console.log('test')
    //     }.toString()
    //   )?.groups?.body || '{}'
    // ) as () => void

    // useEffect(f, [])

    // useEffect(function () {
    //   new Function('mode', 'console.log(mode)')(mode)
    // }, [])

    return (
      <Container
        ref={function init() {
          if (!as.value) as.value = { origin: window.location.origin, items: [] }
        }}
      >
        <CommonProperties>
          <SVGCheckBox
            name='scrolldown'
            id='scrolldown'
            type='checkbox'
            defaultChecked={as.value?.scroll}
            onChange={function toggleScrollOption(e) {
              // console.log(`scrolldown`)
              as.value.scroll = e.target.checked
              const { cache, setState } = getStore().getState()

              setState({ cache: { ...cache } })
            }}
          />
          <SVGLabel htmlFor='scrolldown' data-desc='스크롤'>
            <Scroll />
          </SVGLabel>

          <SVGCheckBox
            name='pagination'
            id='pagination'
            type='checkbox'
            // checked={as.value?.pagination !== undefined}
            defaultChecked={as.value?.pagination !== undefined}
            onChange={function (e) {
              if (!(e.target as HTMLInputElement).checked) return
              plural.current = true
              setMode('select_pagination')
            }}
            onClick={function togglePaginationOption(e) {
              /**
               * prevent default call doesn't revert to before checking
               * It should've, but It depends on browser implementations
               */

              // e.nativeEvent.preventDefault()
              // e.preventDefault()
              // console.log('pagination', (e.target as HTMLInputElement).checked)

              if (!(e.target as HTMLInputElement).checked) {
                as.value.pagination = undefined
                ;(e.target as HTMLInputElement).checked = false
              }
              // plural.current = true
              // setMode('select_pagination')
              // as.value.pagination = await new Promise<Required<Scrape['value']>['pagination']>(function (
              //   resolve,
              //   reject
              // ) {
              //   setOverlay(<OverlayForm onResolve={resolve} onReject={reject} />)
              // })
              // ;(e.target as HTMLInputElement).checked = true
            }}
          />
          <SVGLabel htmlFor='pagination' data-desc='페이지네이션'>
            <Pagination2 />
          </SVGLabel>

          <UtilityButton
            data-desc='타겟 추가'
            onClick={async function (e) {
              try {
                // console.log((await selectTarget()).target)
                plural.current = !!(await selectNumber()).plural
                borderColor.current = getRandomColor()
                setMode('select_target')
              } catch (err: any) {
                return console.log('canceled by user')
              }
            }}
          >
            <Plus />
          </UtilityButton>
          <UtilityButton
            data-desc='삭제'
            disabled={selectedItem === null}
            onClick={function (e) {
              if (!selectedItem) return
              const { cache, setState } = getStore().getState()

              as.value.items = as.value.items.filter((i) => i !== selectedItem && i.group !== selectedItem.id)
              delete as.snapshot[selectedItem.name]
              delete as.snapshot[`${selectedItem.name}$html`]
              delete as.spread[selectedItem.name]
              delete as.spread[`${selectedItem.name}$html`]

              setSelectedItem(null)
              setState({ cache: { ...cache } })
            }}
          >
            <Minus />
          </UtilityButton>
        </CommonProperties>
        {as.value?.items
          .filter((i) => i.target === 0)
          .map((group) => (
            <Item
              key={group.name}
              data-desc={group.name}
              selected={selectedItem === group}
              css={{ border: `2px dotted ${group.borderColor}` }}
              onClick={function (e) {
                if (selectedItem === group) {
                  const revert = setOverlay(
                    <SubstituteNameInput
                      initial={group.name}
                      substitutes={Object.keys(snapshot)}
                      onReject={function () {
                        revert()
                      }}
                      onResolve={function (name) {
                        as.snapshot[name] = as.snapshot[group.name]
                        group.name = name

                        revert()
                        setSelectedItem(null)
                      }}
                    />
                  )
                } else setSelectedItem(group)
              }}
            >
              <EllipticalLabel title={group.name}>{group.name}</EllipticalLabel>
            </Item>
          ))}
        {as.value?.items
          .filter((i) => i.target !== 0)
          .map((item) => (
            <Item
              key={item.name}
              data-desc={item.name}
              selected={selectedItem === item}
              css={{ border: `2px solid ${item.borderColor}` }}
              onClick={function (e) {
                if (selectedItem === item) {
                  const revert = setOverlay(
                    <SubstituteNameInput
                      initial={item.name}
                      substitutes={Object.keys(snapshot)}
                      onReject={function () {
                        revert()
                      }}
                      onResolve={function (name) {
                        as.snapshot[name] = as.snapshot[item.name]
                        as.snapshot[`${name}$html`] = as.snapshot[`${item.name}$html`]
                        delete as.snapshot[item.name]
                        delete as.snapshot[`${item.name}$html`]
                        item.name = name
                        revert()
                        setSelectedItem(null)
                      }}
                    />
                  )
                } else setSelectedItem(item)
              }}
            >
              <EllipticalLabel title={item.name}>{item.name}</EllipticalLabel>
            </Item>
          ))}
        {mode === 'select_target' &&
          createPortal(
            <AdvancedOptionsContainer>
              {/* <ElementNumber
                type='number'
                disabled={plural.current === false}
                min={1}
                placeholder='[개수]'
                onChange={function (e) {
                  if (e.target.value === undefined || e.target.value === '') elementNumber.current = undefined
                  else elementNumber.current = parseInt(e.target.value, 10)
                }}
              /> */}

              {plural.current && (
                <Input
                  style={{ position: 'relative' }}
                  type='checkbox'
                  defaultChecked={classSelector.current}
                  onChange={function (e) {
                    classSelector.current = e.target.checked
                  }}
                  data-desc='클래스 선택자를 포함합니다'
                />
              )}

              {plural.current && (
                <SelectorDepth
                  type='number'
                  placeholder='{Depth}'
                  onChange={function (e) {
                    if (e.target.value === undefined || e.target.value === '') selectorDepth.current = undefined
                    else selectorDepth.current = parseInt(e.target.value, 10)
                  }}
                />
              )}

              <Select
                defaultValue={groupItemId.current}
                /**
                 * you can't draw with ref callback
                 * because It's invoked before draw effect which erases all previous borders including group borders
                 * you must draw with effect
                 */
                onClick={function (e) {
                  e.stopPropagation()
                }}
                onChange={function (e) {
                  const { value } = e.target as HTMLSelectElement
                  groupItemId.current = value

                  // erase previous group if any
                  roots.current
                    .flatMap((doc) => Array.from(doc.querySelectorAll('[data-gatsby-group]')))
                    .forEach((s) => s.remove())

                  if (!value) {
                    groups.current = roots.current
                    return
                  }

                  // draw group
                  const gi = as.value?.items.find((i) => i.id === value)
                  if (!gi) throw new Error('DESIGNER:SCRAPE:GROUP_SELECTOR:NO_ITEM_MATCHED')
                  groups.current = getFilteredElementMatrix(as.value.items, gi).flat()
                  groups.current.forEach((ge) =>
                    drawOverlayBorder(ge, `1px dotted ${gi.borderColor}`).setAttribute(`data-gatsby-group`, 'true')
                  )
                }}
              >
                <Option value=''>없음</Option>
                {as.value?.items
                  .filter((i) => !i.target)
                  .map((gi) => (
                    <Option value={gi.id} key={gi.id}>
                      {gi.name}
                    </Option>
                  ))}
              </Select>
            </AdvancedOptionsContainer>,
            safeGetBody().querySelector('#gatsby-frame')!
          )}
        {mode === 'select_target' &&
          selectorContainer &&
          current.current &&
          createPortal(
            /**
             * todo :
             * implement shrinker
             */

            <SelectorContainer
              onSubmit={async function (e) {
                e.preventDefault()

                const { cache, setState } = getStore().getState()

                const target = parseInt(
                  (e.currentTarget.querySelector('input[name="target"]') as HTMLInputElement).value,
                  10
                )

                // console.log('check1')

                const name = await new Promise<string>(function (resolve, reject) {
                  // console.log('check2')
                  setOverlay(
                    <SubstituteNameInput
                      substitutes={Object.keys(snapshot)}
                      onResolve={resolve}
                      onReject={function (reason) {
                        resolve('')
                      }}
                    />
                  )
                }).finally(function unmount() {
                  // console.log('check3')
                  setOverlay(null)
                })

                if (!name) return

                // console.log('check4')

                /**
                 * frame should be array matching select
                 */

                const item: __Action__Scrape['schema']['items'][number] = {
                  query: query.current,
                  id: v4(),
                  borderColor: borderColor.current,
                  target,
                  name,
                  group: groupItemId.current || undefined
                }

                as.value.items.push(item)

                const elementMatrix = getFilteredElementMatrix(as.value.items, item)

                if (item.target)
                  Object.assign(as.snapshot, {
                    [item.name]: elementMatrix.slice(0, SNAPSHOT_MAX_ROW_LENGTH).map(function (elements) {
                      return elements.slice(0, SNAPSHOT_MAX_COL_LENGTH).map(function (ele) {
                        switch (item.target) {
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
                            const src = ele.getAttribute('src')
                            return src
                              ? src.startsWith('/')
                                ? `${(ele.ownerDocument.defaultView || window).location.origin}${src}`
                                : src
                              : ''
                          default:
                            return ''
                        }
                      })
                    }),
                    [`${item.name}$html`]: elementMatrix
                      .slice(0, SNAPSHOT_MAX_ROW_LENGTH)
                      .map((elements) =>
                        elements
                          .slice(0, SNAPSHOT_MAX_COL_LENGTH)
                          .map((ele) => ele.outerHTML.slice(0, SNAPSHOT_MAX_DATA_LENGTH))
                      )
                  })

                as.scope[`${item.name}$html`] = 'intermediate'

                // as.snapshot = Object.fromEntries(
                //   as.value.items
                //     .filter((i): i is Required<Scrape['value']['items'][number]> => i?.target !== 0)
                //     .map((item) => [
                //       item.name,
                //       getFilteredElementMatrix(as.value.items, item)
                //         .slice(0, SNAPSHOT_MAX_ROW_LENGTH)
                //         .map(function (elements) {
                //           return elements.slice(0, SNAPSHOT_MAX_COL_LENGTH).map(function (ele) {
                //             switch (item.target) {
                //               case 0b1:
                //                 return ele.innerText?.trim() || ''
                //               case 0b10:
                //                 const href = ele.getAttribute('href')
                //                 return href
                //                   ? href.startsWith('/')
                //                     ? `${(ele.ownerDocument.defaultView || window).location.origin}${href}`
                //                     : href
                //                   : ''
                //               case 0b100:
                //                 const src = ele.getAttribute('src')
                //                 return src
                //                   ? src.startsWith('/')
                //                     ? `${(ele.ownerDocument.defaultView || window).location.origin}${src}`
                //                     : src
                //                   : ''
                //               default:
                //                 return ''
                //             }
                //           })
                //         })
                //     ])
                // )

                setState({ cache: { ...cache } })
                setSelectorContainer(null)
                setMode('normal')
              }}
            >
              {/* <SelectorButtonLayer>
                <PinButton
                  type='button'
                  pinned={pinned}
                  onClick={function () {
                    setPinned((prev) => !prev)
                  }}
                >
                  <Pin2 />
                </PinButton>
              </SelectorButtonLayer> */}
              {/* <Tag>{extractSelector(select.current)}</Tag> */}
              <Input name='target' css={{ display: 'none' }} />

              <TargetOption>
                <TargetButton
                  data-desc='그룹'
                  type='submit'
                  onClick={function (e) {
                    e.stopPropagation()

                    Object.assign(safeGetBody().querySelector('input[name="target"]') as HTMLInputElement, {
                      value: 0
                    })
                  }}
                >
                  <DottedRectangle />
                </TargetButton>
                <TargetSample
                  title={select.current
                    .map(
                      (s, index) =>
                        `[${family.current[index].length}]{${getDepth(s)}}${
                          classSelector.current ? extractClass(s) : ''
                        }`
                    )
                    .join('\n')}
                >
                  {select.current
                    .map(
                      (s, index) =>
                        `[${family.current[index].length}]{${getDepth(s)}}${
                          classSelector.current ? extractClass(s) : s.tagName.toLocaleLowerCase()
                        }`
                    )
                    .join(', ')}
                </TargetSample>
              </TargetOption>

              <Separator />

              <TargetOption>
                <TargetButton
                  data-desc='텍스트'
                  type='submit'
                  onClick={function (e) {
                    e.stopPropagation()

                    Object.assign(safeGetBody().querySelector('input[name="target"]') as HTMLInputElement, {
                      value: 1
                    })
                  }}
                >
                  <TextFormat />
                </TargetButton>
                <TargetSample
                  title={family.current
                    .flat()
                    .map((ele) => ele.innerText?.trim() || '')
                    .join('\n')}
                >
                  {/* {groups.current
                        .flatMap((group) =>
                          query.current.flatMap(
                            ({ selector }) => Array.from(group.querySelectorAll(selector)) as Array<HTMLElement>
                          )
                        )
                        .map((ele) => ele.innerText?.trim() || '')
                        .join(',')} */}
                  {family.current
                    .flat()
                    .map((ele) => ele.innerText?.trim() || '')
                    .join(',')}
                </TargetSample>
              </TargetOption>

              <TargetOption>
                <TargetButton
                  data-desc='링크'
                  type='submit'
                  onClick={function (e) {
                    e.stopPropagation()

                    Object.assign(safeGetBody().querySelector('input[name="target"]') as HTMLInputElement, {
                      value: 2
                    })
                  }}
                >
                  <URLLink />
                </TargetButton>
                <TargetSample
                  title={family.current
                    .flat()
                    .map((ele) => ele.getAttribute('href') || '')
                    .join('\n')}
                >
                  {/* {groups.current
                        .flatMap((group) =>
                          select.current.flatMap((s) =>
                            Array.from(
                              group.querySelectorAll(
                                plural.current
                                  ? recursiveExtractStructure(s, selectorDepth.current, classSelector.current)
                                  : recursiveExtractSelector(s, selectorDepth.current)
                              )
                            )
                          )
                        )
                        .map((ele) => ele.getAttribute('href') || '')
                        .join(',')} */}
                  {family.current
                    .flat()
                    .map((ele) => ele.getAttribute('href') || '')
                    .join(',')}
                </TargetSample>
              </TargetOption>

              <TargetOption>
                <TargetButton
                  data-desc='이미지/동영상'
                  type='submit'
                  onClick={function (e) {
                    e.stopPropagation()

                    Object.assign(safeGetBody().querySelector('input[name="target"]') as HTMLInputElement, {
                      value: 4
                    })
                  }}
                >
                  <Picture />
                </TargetButton>
                <TargetSample
                  title={family.current
                    .flat()
                    .map((ele) => ele.getAttribute('src') || ele.getAttribute('data-src') || '')
                    .join('\n')}
                >
                  {/* {groups.current
                        .flatMap((group) =>
                          select.current.flatMap((s) =>
                            Array.from(
                              group.querySelectorAll(
                                plural.current
                                  ? recursiveExtractStructure(s, selectorDepth.current, classSelector.current)
                                  : recursiveExtractSelector(s, selectorDepth.current)
                              )
                            )
                          )
                        )
                        .map((ele) => ele.getAttribute('src') || '')
                        .join(',')} */}
                  {family.current
                    .flat()
                    .map((ele) => ele.getAttribute('src') || ele.getAttribute('data-src') || '')
                    .join(',')}
                </TargetSample>
              </TargetOption>
            </SelectorContainer>,
            selectorContainer
          )}
      </Container>
    )

    function getDepth(ele: HTMLElement) {
      let depth = 0

      let parent = ele.parentElement

      while (parent) {
        depth += 1
        parent = parent.parentElement
      }

      return depth
    }

    function createAppendingContainerWithAbsoluteCoordinates(
      target: HTMLElement,
      width: number,
      height: number
    ): HTMLDivElement {
      const iframe = getOwnerIframe(target)
      const offset = iframe?.getBoundingClientRect()

      const container = window.top!.document.createElement('div')
      const rect = target.getBoundingClientRect()

      const x = rect.left + (offset ? offset.x : 0)
      const y = rect.top + (offset ? offset.y : 0)

      /**
       * these below are length, not coordinate
       */
      const marginLeft = x
      const marginTop = y
      const marginRight = window.top!.document.documentElement.clientWidth - x - rect.width
      const marginBottom = window.top!.document.documentElement.clientHeight - y - rect.height

      const padding = 5

      switch (Math.max(marginLeft, marginTop, marginRight, marginBottom)) {
        /**
         * these css properties should be set in coordinates
         */
        case marginLeft:
          container.style.top = `${
            marginTop -
            height / 2 +
            (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollTop : 0)
          }px`
          container.style.right = `${
            rect.width +
            marginRight -
            (width > marginLeft ? width - marginLeft : -padding) +
            (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollLeft : 0)
          }px`
          break
        case marginTop:
          container.style.bottom = `${
            rect.height +
            marginBottom -
            (height > marginTop ? height - marginTop : -padding) +
            (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollTop : 0)
          }px`
          container.style.left = `${
            marginLeft -
            width / 2 +
            (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollLeft : 0)
          }px`
          break
        case marginRight:
          container.style.top = `${
            marginTop -
            height / 2 +
            (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollTop : 0)
          }px`
          container.style.left = `${
            rect.width +
            marginLeft -
            (width > marginRight ? width - marginRight : -padding) +
            (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollLeft : 0)
          }px`
          break
        case marginBottom:
          container.style.top = `${
            rect.height +
            marginTop -
            (height > marginBottom ? height - marginBottom : -padding) +
            (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollTop : 0)
          }px`
          container.style.left = `${
            marginLeft + (target.ownerDocument.scrollingElement ? target.ownerDocument.scrollingElement.scrollLeft : 0)
          }px`
          break
        default:
          break
      }

      container.style.position = 'absolute'

      return container
    }

    function selectNumber(): Promise<{ plural: boolean }> {
      const NumberButton = styled(SVGButton)`
        & > svg {
          width: 28px;
          height: 28px;
        }
      `

      return new Promise<{ plural: boolean }>(function (resolve, reject) {
        setOverlay(
          <OverlayForm
            onResolve={resolve}
            onReject={reject}
            cssOnFrame={{
              flexDirection: 'row',
              boxShadow: 'var(--shadow-elevation4)',
              backgroundColor: 'var(--color-bg-secondary)',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              minWidth: '400px',
              minHeight: '300px'
            }}
          >
            <OverlayLabel htmlFor='plural' css={{ display: 'none' }} />
            <OverlayInput name='plural' css={{ display: 'none' }} />

            <NumberButton
              data-desc='수집하고자 하는 요소가 한 개 입니다'
              type='submit'
              onClick={function (e) {
                e.stopPropagation()

                Object.assign(safeGetBody().querySelector('input[name="plural"]') as HTMLButtonElement, {
                  value: ''
                })
              }}
            >
              <NumberOne />
            </NumberButton>

            <NumberButton
              data-desc='수집하고자 하는 요소가 여러개 입니다'
              type='submit'
              onClick={function (e) {
                e.stopPropagation()

                Object.assign(safeGetBody().querySelector('input[name="plural"]') as HTMLButtonElement, {
                  value: '1'
                })
              }}
            >
              <List3 />
            </NumberButton>
          </OverlayForm>
        )
      })
    }
  },
  specify({ as }) {
    return (
      <SpecificationTable>
        <Colgroup>
          <Column css={{ width: '15%', maxWidth: '15%' }} />
          <Column css={{ width: '75%', maxWidth: '70%' }} />
          <Column css={{ width: '15%', maxWidth: '15%' }} />
        </Colgroup>
        <TableBody>
          <TableRow>
            <TableHeader>이름</TableHeader>
            <TableHeader>값</TableHeader>
            <TableHeader>그룹</TableHeader>
            {/* <TableHeader>셀렉터</TableHeader> */}
          </TableRow>
          {as.value?.items
            .filter((i): i is Required<__Action__Scrape['schema']['items'][number]> => i?.target !== 0)
            .map((item, index) => (
              <TableRow key={item.id}>
                <TableData>{item.name}</TableData>
                {/* todo : list with index on click */}
                <TableData>
                  <EllipticalAbbr title={as.snapshot[item.name] && stringifyData(as.snapshot[item.name])}>
                    {as.snapshot[item.name] && stringifyData(as.snapshot[item.name])}
                  </EllipticalAbbr>
                </TableData>
                <TableData>{as.value.items.find((i) => i.id === item.group)?.name || ''}</TableData>
                {/* <TableData>{item.selector}</TableData> */}
              </TableRow>
            ))}
        </TableBody>
      </SpecificationTable>
    )
  }
}
