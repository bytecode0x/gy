import Capture2 from 'lib/asset/svg/Capture2'
import Finish from 'lib/asset/svg/Finish'
import Minus from 'lib/asset/svg/Minus'
import Plus from 'lib/asset/svg/Plus'
import RawClose from 'lib/asset/svg/RawClose'
import Undo from 'lib/asset/svg/Undo'
import { SetGyState } from 'lib/event/sementic'
import {
    Abbr,
    FlexCenterDiv,
    FlexColumnDiv,
    SVGButton,
    TableData,
    TableHeader,
    TableRow,
    TextButton
} from 'lib/frame/generic'
import { ElevatedButton, ElevatedForm, RecordItem } from 'lib/frame/sementic'
import { getRandomColor } from 'lib/util/common'
import {
    createAppendingContainerWithRelativeCoordinates,
    extractClass,
    getChromeHeight,
    getDocuments,
    getOwnerIframe,
    recursiveExtractSelector
} from 'lib/util/dom/common'
import { __Action__Click } from 'local/desktop/main/gy/type/action.preset'
import { createMouseCapturer, drawMouseRecordOn } from 'local/extension/lib/function/record-mouse'
import { createScraper } from 'local/extension/lib/function/scrape-element'
import { FC, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { MouseTape } from 'type/app'
import OverlayForm from '../components/OverlayForm'
import { getEvHandler } from '../event/entity/content-event-handler'
import { OverlayInput, OverlayLabel, SpecificationTable } from '../frames'
import { displayUI, removeUI } from '../functions'
import { getAppContainer, safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

const Container = styled(FlexColumnDiv)`
  align-items: stretch;
  padding: 4px;

  & > * {
    margin-top: 6px;
  }
`

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

const Item = styled(RecordItem)<{ tapeColor: string; selected?: boolean }>`
  &::after {
    content: ' ';
    width: 24px;
    height: 6px;
    background-color: ${(state) => state.tapeColor};
  }
`

const UtilityButton = styled(SVGButton)``

type Mode = 'record' | 'normal'

type RecordTarget = 'element' | 'screen'

export const CLICK: ActionInput<__Action__Click> = {
  help: '실제 마우스 포인터를 조작합니다',
  template: 'CLICK',
  onActionLabelChange(as, prev) {
    const value = as.snapshot[prev]
    if (!value) return
    const flag = as.spread[prev]
    as.snapshot = { [as.name]: value }
    as.spread = { [as.name]: flag }
  },
  design({ as }) {
    const [tapes, setTapes] = useState<Array<MouseTape>>(as.value?.tapes || [])
    const [mode, setMode] = useState<Mode>('normal')
    const [selected, setSelected] = useState<MouseTape>()
    const docs = useRef<Array<Document>>(getDocuments()).current

    useEffect(function checkChromeHeight() {
      if (process.env.NODE_ENV === 'devserver') return

      const {
        gy: { gdr }
      } = getStore().getState()

      if ('CHROME_HEIGHT' in gdr) return

      const evHandler = getEvHandler()

      getChromeHeight().then(function (ch) {
        gdr.CHROME_HEIGHT = [[ch.toString()]]
        return evHandler.sendEvent<SetGyState>({
          name: 'SET_GY_STATE',
          payload: { gdr },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })
      })
    }, [])

    useEffect(
      function syncRecordWithState() {
        as.value = {
          // direction: 'left',
          tapes
        }
      },
      [tapes, tapes.length]
    )

    useEffect(
      function () {
        switch (mode) {
          case 'normal': {
            displayUI()
            break
          }
          case 'record': {
            removeUI()
            break
          }
          default: {
            break
          }
        }
      },
      [mode]
    )

    useEffect(
      function draw() {
        if (mode !== 'normal') return
        as.value.tapes.forEach(function (tape) {
          const target = (
            tape.context.frame
              ? (document.querySelector(tape.context.frame) as HTMLIFrameElement).contentDocument?.querySelector(
                  tape.context.id
                )
              : document.querySelector(tape.context.id)
          ) as HTMLElement

          drawMouseRecordOn(target, tape)
        })

        return function cleanup() {
          docs.forEach((doc) => doc.querySelector('#mouse-record-overlay')?.remove())
        }
      },
      [mode, tapes, tapes.length]
    )

    useEffect(function log() {
      console.log('click as : ', as)
    }, [])

    useEffect(
      function scrollToSelected() {
        // scrollIntoViewIfNeeded method is still experimental

        const mask = docs
          .map((doc) => doc.querySelector(`#mouse-record-overlay > [data-tape-mask="${selected?.id}"]`))
          .find((ele) => ele)

        if (!mask) return
        // @ts-ignore
        if ('scrollIntoViewIfNeeded' in mask) mask.scrollIntoViewIfNeeded()
        else mask.scrollIntoView()

        mask.animate(
          { opacity: [0, 1, 0] },
          {
            iterations: 4,
            duration: 1000,
            easing: 'linear'
          }
        )
      },
      [selected]
    )

    // useEffect(function () {
    //   if (as.value) return
    //   const evHandler = getEvHandler()
    //   evHandler
    //     .sendEvent<SchemeAction<Click>>({
    //       name: 'SCHEME_ACTION',
    //       payload: 'CLICK',
    //       meta: { receiver: { alias: 'MAIN', component: 'MAIN' } }
    //     })
    //     .then(function (value) {
    //       as.value = value

    //       // implement later

    //       const { procedureSchemas, setState } = getStore().getState()
    //       setState({ procedureSchemas: procedureSchemas.slice() })
    //     })
    // })

    return (
      <>
        <Container
          ref={function init() {
            if (!as.value) as.value = { tapes }
          }}
        >
          <CommonProperties>
            <UtilityButton
              data-desc='삭제'
              disabled={!selected}
              onClick={function () {
                if (!selected) return
                setTapes(tapes.filter((tape) => tape !== selected))
              }}
            >
              <Minus />
            </UtilityButton>
            <UtilityButton
              data-desc='타겟 추가'
              onClick={function () {
                setMode('record')
              }}
            >
              <Plus />
            </UtilityButton>
            {/* <UtilityButton
          disabled={selectedItem === null}
          onClick={function (e) {
            if (!selectedItem) return
            const { procedureSchemas, setState } = getStore().getState()
            as.value.items = as.value.items.filter((i) => i !== selectedItem && i.group !== selectedItem.id)
            delete as.snapshot[selectedItem.name]
            delete as.spread[selectedItem.name]

            setSelectedItem(null)
            setState({ procedureSchemas: procedureSchemas.slice() })
          }}
        >
          <Minus />
        </UtilityButton> */}
          </CommonProperties>
          {tapes.map((tape) => (
            <Item
              key={tape.id}
              tapeColor={tape.color}
              selected={tape === selected}
              onClick={function () {
                setSelected(selected === tape ? undefined : tape)
              }}
            />
          ))}
        </Container>
        {(function () {
          switch (mode) {
            case 'record': {
              return (
                <RecordTargetSelector
                  target='element'
                  onResolved={function (tape) {
                    setTapes((prev) => prev.concat([tape]))
                    setMode('normal')
                  }}
                  onRejected={function () {
                    setMode('normal')
                  }}
                />
              )
            }
            default: {
              return <></>
            }
          }
        })()}
      </>
    )
  },
  specify({ as }) {
    return (
      <SpecificationTable>
        <TableRow>
          {['컨텍스트', '방향'].map((key, index) => (
            <TableHeader key={index}>{key}</TableHeader>
          ))}
        </TableRow>

        {as.value?.tapes?.map((tape, index) => (
          <TableRow key={index}>
            <TableData>{tape.context.name}</TableData>
            <TableData>{tape.name}</TableData>
          </TableRow>
        ))}
      </SpecificationTable>
    )
  }
}

const ButtonsLayout = styled(FlexCenterDiv)`
  padding: 4px;

  & > button {
    margin: 2px 4px;
  }
`

const OptionLayer = styled(FlexCenterDiv)`
  padding: 4px;

  & > button {
    margin-right: 6px;
  }
`

const OptionLabel = styled(Abbr)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const RecordTargetSelector: FC<{
  target: RecordTarget
  onResolved: (tape: MouseTape) => void
  onRejected: () => void
}> = ({ target, onResolved, onRejected }) => {
  // const [mode, setMode] = useState<RecordTarget>('element')
  const [formContainer, setFormContainer] = useState<HTMLDivElement | null>(null)
  const scraper = useRef(
    createScraper({
      color: getRandomColor(),
      exclude: [getAppContainer()],
      plural: false,
      onCurrentChange(ele) {
        if (!ele) return setFormContainer(null)
        const container = createAppendingContainerWithRelativeCoordinates({
          target: ele,
          direction: 'vertical',
          /**
           * this might be wrong
           */
          stackingFrame: document.body
        })

        setFormContainer(container)

        return function cleanup() {
          container.remove()
        }
      },
      onStop() {
        setFormContainer(null)
        onRejected()
      }
    })
  ).current
  const capturer = useRef(createMouseCapturer({ color: scraper.color })).current

  /**
   * todo
   * on finish capturing
   */

  /**
   * element, screen 선택 인터페이스 구현
   *
   */

  useEffect(
    function () {
      switch (target) {
        case 'element': {
          scraper.start()
          break
        }
        case 'screen': {
          if (!scraper.current) break
          const frame = getOwnerIframe(scraper.current)
          capturer.setTarget(scraper.current, {
            name: 'element',
            id: recursiveExtractSelector(scraper.current),
            frame: frame && recursiveExtractSelector(frame)
          })
          if (!capturer.mask) break

          capturer.start()
          break
        }
        default: {
          break
        }
      }

      return function cleanup() {
        switch (target) {
          case 'element': {
            console.log('select cleanup')
            scraper.finish()
            return
          }
          case 'screen': {
            console.log('capture cleanup')

            capturer.finish()
            return
          }
          default: {
            throw new Error('')
          }
        }
      }
    },
    [target]
  )

  if (!formContainer || !scraper.current) return <></>

  return createPortal(
    (function () {
      switch (target) {
        case 'element': {
          return (
            <ElevatedForm
              onSubmit={function (e) {
                e.preventDefault()

                const query = scraper.finish()

                /**
                 * todo
                 * 1. process query to tape
                 */

                // query.map( q => q.)

                // onResolved({ context: 'element', color: '', value: [[{ }]]})
                // setMode('screen')
              }}
            >
              <OptionLayer>
                <ElevatedButton data-desc='마우스 캡쳐' type='submit'>
                  <Capture2 />
                </ElevatedButton>
                <OptionLabel title={extractClass(scraper.current)}>{extractClass(scraper.current)}</OptionLabel>
              </OptionLayer>
            </ElevatedForm>
          )
        }
        case 'screen': {
          return (
            <ElevatedForm>
              <ButtonsLayout>
                <ElevatedButton
                  data-desc='확인'
                  type='button'
                  onClick={function (e) {
                    formContainer.remove()
                    onResolved(capturer.finish())
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
                    // setMode('element')
                  }}
                >
                  <RawClose />
                </ElevatedButton>
              </ButtonsLayout>
            </ElevatedForm>
          )
        }
        default: {
          return <></>
        }
      }
    })(),
    formContainer
  )
}

const TypeButton = styled(TextButton)``

function selectTarget(): Promise<{
  target: RecordTarget
}> {
  return new Promise<{ target: RecordTarget }>(function (resolve, reject) {
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
        <OverlayLabel htmlFor='type' css={{ display: 'none' }} />
        <OverlayInput name='type' css={{ display: 'none' }} />

        <TypeButton
          data-desc='스크린 좌표를 물리적으로 클릭 합니다'
          type='submit'
          onClick={function (e) {
            e.stopPropagation()

            Object.assign(safeGetBody().querySelector('input[name="type"]') as HTMLButtonElement, {
              value: 'screen' as RecordTarget
            })
          }}
        >
          스크린 좌표
        </TypeButton>

        <TypeButton
          data-desc='웹 페이지 요소를 물리적/가상으로 클릭 합니다'
          type='submit'
          onClick={function (e) {
            e.stopPropagation()

            Object.assign(safeGetBody().querySelector('input[name="type"]') as HTMLButtonElement, {
              value: 'element' as RecordTarget
            })
          }}
        >
          웹 페이지 요소
        </TypeButton>
      </OverlayForm>
    )
  })
}
