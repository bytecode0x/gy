import Paste from 'lib/asset/svg/Clipboard'
import Copy from 'lib/asset/svg/Copy'
import Form from 'lib/component/Form'
import { ActionInterfaceSuperset, ActionSchema, InitialActionSchema } from 'lib/gy/core/type/action'

import { GetProcedureSchema } from 'lib/event/sementic'
import { actionInput } from 'local/extension/content-script/action-input'
import GlobalUtility from 'local/extension/content-script/components/GlobalUtility'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import { ComponentProps, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'

import Extend from 'lib/asset/svg/Extend'
import Minus from 'lib/asset/svg/Minus'
import Plus from 'lib/asset/svg/Plus'
import { Shrinker } from 'lib/component/Shrinker'
import { Div, FlexCenterDiv, FlexColumnDiv, FlexDiv, Label, Span, SVGButton, TextButton } from 'lib/frame/generic'
import { TaskSchema } from 'lib/gy/core/type/task'
import { SCROLL } from 'lib/styled-css-property'
import { pushMessage } from 'lib/util/dom/render'
import { ActionPreset } from 'local/desktop/main/gy/type/action.preset'
import styled from 'styled-components'
import { v4 } from 'uuid'
import { z } from 'zod'
import shallow from 'zustand/shallow'
import ActionSelector from '../../components/ActionSelector'

const Builder = () => {
  const [cache, config, setState] = getStore()(
    useCallback((state) => [state.cache, state.config, state.setState], []),
    shallow
  )
  const [currentActionIndex, setActionIndex] = useState<number>(-1)
  const { taskId } = useParams()
  const specContainer = useRef<HTMLDivElement>(null)
  const actionsContainer = useRef<HTMLDivElement>(null)

  const decideSpreading = useCallback(
    function () {
      const proc = cache.procedures.find((p) => !!p.tasks.flat().find((ts) => ts.id === taskId))
      if (!proc) throw new Error('BUILDER:DECIDE_SPREDING:NO_PROC_MATCHED')
      const task = proc.tasks.flat().find((ts) => ts.id === taskId)
      if (!task) throw new Error('BUILDER:DECIDE_SPREDING:NO_TASK_MATCHED')
      const action = task.actions[currentActionIndex]
      if (!action) throw new Error('BUILDER:DECIDE_SPREDING:NO_ACTION_MATCHED')

      const revertOverlay = setOverlay(
        <Form
          record={{
            '스냅샷(snapshot) 관리': {
              data: '눌러서 값을 설정하세요',
              effect(getter, setter) {
                const revertOverlay = setOverlay(
                  <Form
                    width={600}
                    height={450}
                    header='스냅샷(snapshot) 관리'
                    onReject={function () {
                      revertOverlay()
                    }}
                    onResolve={function (formData) {
                      action.snapshot = formData
                      revertOverlay()
                    }}
                    record={Object.fromEntries(
                      Object.keys(action.snapshot).map((substitute) => [
                        substitute,
                        {
                          data: action.snapshot[substitute],
                          labeler(value) {
                            return 'click to remove'
                          },
                          effect(getter, setter, remove) {
                            remove()
                          }
                        } as ComponentProps<typeof Form>['record'][string]
                      ])
                    )}
                  />
                )
              }
            },
            '스프레딩(spreading) 설정': {
              data: '눌러서 값을 설정하세요',
              effect(getter, setter) {
                const revertOverlay = setOverlay(
                  <Form
                    width={600}
                    height={450}
                    header='스프레딩(spreading) 설정'
                    onReject={function () {
                      revertOverlay()
                    }}
                    onResolve={function (formData) {
                      action.spread = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, JSON.parse(v)]))
                      revertOverlay()
                    }}
                    record={Object.fromEntries(
                      Object.keys(action.snapshot).map((substitute) => [
                        substitute,
                        {
                          data: action.spread[substitute] || false,
                          labeler(value) {
                            return value ? 'spreading' : 'non-spreading'
                          },
                          effect(getter, setter) {
                            setter(!getter())
                          }
                        } as ComponentProps<typeof Form>['record'][string]
                      ])
                    )}
                  />
                )
              }
            },
            '기록(recording) 설정': {
              data: '눌러서 값을 설정하세요',
              effect(getter, setter) {
                const revertOverlay = setOverlay(
                  <Form
                    width={600}
                    height={450}
                    header='기록(recording) 설정; 개인 정보는 트리에 기록하지 마세요'
                    onReject={function () {
                      revertOverlay()
                    }}
                    onResolve={function (formData) {
                      action.scope = formData as ActionSchema['scope']
                      revertOverlay()
                    }}
                    record={Object.fromEntries(
                      Object.keys(action.snapshot).map((substitute) => [
                        substitute,
                        {
                          // remove action.scope later
                          data: (action.scope && action.scope[substitute]) || 'public',
                          labeler(value) {
                            switch (value as ActionSchema['scope'][string]) {
                              case 'private': {
                                return '트리 저장시 기록안함'
                              }
                              case 'intermediate': {
                                return '트리에 할당 안함'
                              }
                              case 'public': {
                                return '공개함'
                              }

                              default: {
                                throw new Error('RECORDING_CONFIGURATION:INVALID_PROPERTY')
                              }
                            }
                          },
                          effect(getter, setter) {
                            const rotation = ['public', 'private', 'intermediate']
                            const index = rotation.findIndex((v) => v === getter())
                            setter(rotation[(index + 1) % rotation.length])
                          }
                        } as ComponentProps<typeof Form>['record'][string]
                      ])
                    )}
                  />
                )
              }
            }
          }}
          header='Data Reocrd Configuration'
          onReject={function () {
            revertOverlay()
          }}
          onResolve={function (formData) {
            revertOverlay()
            setState({ cache: { ...cache } })
          }}
        />
      )
    },
    [currentActionIndex, taskId, cache]
  )

  const copyToClipboard = useCallback(
    function () {
      if (!proc || !task || !action) return
      navigator.clipboard.writeText(`${proc.id} > ${task.id} > ${action.id}`).then(
        function onSuccess() {
          return pushMessage({
            message: `클립보드로 복사되었습니다`,
            layer: safeGetBody().querySelector('#push')
          })
        },
        function onFail() {
          return pushMessage({
            message: `클립보드로 복사에 실패했습니다`,
            layer: safeGetBody().querySelector('#push')
          })
        }
      )
    },
    [cache, currentActionIndex, taskId]
  )

  const pasteAction = useCallback(
    async function () {
      const routeToken = window.prompt('복사할 action 의 route token 값을 입력해주세요')

      if (!routeToken) return

      const [pid, tid, aid] = routeToken.split(/\s*>\s*/)

      if (!pid || !tid || !aid)
        return pushMessage({
          message: `잘못된 값입니다`,
          layer: safeGetBody().querySelector('#push')
        })

      const evHandler = getEvHandler()
      const ps =
        cache.procedures.find((ps) => ps.id === pid) ||
        (await evHandler.sendEvent<GetProcedureSchema>({
          name: 'GET_PROCEDURE_SCHEMA',
          payload: { pid },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        }))

      if (!ps)
        return pushMessage({
          message: `해당 프로시져를 찾을 수 없습니다`,
          layer: safeGetBody().querySelector('#push')
        })

      const ts = ps.tasks.flat().find((ts) => ts.id === tid)

      if (!ts)
        return pushMessage({
          message: `해당 태스크를 찾을 수 없습니다`,
          layer: safeGetBody().querySelector('#push')
        })

      const action = ts.actions.find((action) => action.id === aid) as ActionSchema<ActionInterfaceSuperset>

      if (!action)
        return pushMessage({
          message: `해당 액션을 찾을 수 없습니다`,
          layer: safeGetBody().querySelector('#push')
        })

      task.actions.push({ ...action, id: v4() })

      setActionIndex(task.actions.length - 1)

      setState({ cache: { ...cache } })
    },
    [cache, taskId]
  )

  const pasteFromClipboard = useCallback(
    async function () {
      const queryString = window.prompt('복사할 액션의 쿼리스트링을 입력하세요', await navigator.clipboard.readText())

      if (!queryString) return

      const partial = queryString.split('>')

      const actionQuery = partial.pop()
      const taskQuery = partial.pop()
      const procQuery = partial.pop()

      const schema = z.string().uuid()

      if (
        !actionQuery ||
        !schema.safeParse(actionQuery).success ||
        !taskQuery ||
        !schema.safeParse(taskQuery).success ||
        !procQuery ||
        !schema.safeParse(procQuery).success
      )
        return

      const { gy } = getStore().getState()

      const pr = gy.$procedures.find((pr) => pr.pid === procQuery)

      if (!pr) return

      const evHandler = getEvHandler()

      const ps =
        cache.procedures.find((ps) => ps.id === procQuery) ||
        (await evHandler.sendEvent<GetProcedureSchema>({
          name: 'GET_PROCEDURE_SCHEMA',
          payload: { pid: procQuery },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        }))

      if (!ps) return

      const ts = ps.tasks.flat().find((task) => task.id === taskQuery)

      if (!ts) return

      const as = ts.actions.find((action) => action.id === actionQuery)

      if (!as) return

      const newAs = { ...as, id: v4() } as ActionSchema<ActionPreset>

      task.actions.push(newAs)

      setActionIndex(task.actions.length - 1)

      setState({ cache: { ...cache } })
    },
    [cache]
  )

  useEffect(
    function log() {
      console.log('as : ', action)
    },
    [currentActionIndex]
  )

  const proc = cache.procedures.find((p) => !!p.tasks.flat().find((ts) => ts.id === taskId))!
  const task = proc.tasks.flat().find((ts) => ts.id === taskId)!
  const taskRowIndex = proc.tasks.findIndex((row) => row.includes(task))
  const taskColIndex = proc.tasks[taskRowIndex].findIndex((ts) => ts.id === taskId)

  // const ps = procs.find((p) => p.tasks.flat().includes(task))!
  const action = task?.actions[currentActionIndex]
  const input = actionInput[action?.template as ActionPreset['template']]
  let y: number
  let swapTarget: number

  return (
    <Container>
      {createPortal(
        <>
          <SVGButton data-desc='복사하기' disabled={!action} onClick={copyToClipboard}>
            <Copy />
          </SVGButton>
          <SVGButton data-desc='붙여넣기' onClick={pasteAction}>
            <Paste />
          </SVGButton>
        </>,
        safeGetBody().querySelector('#gu')!
      )}
      <Top id='top'>
        <GlobalUtility />
      </Top>

      <Right
        id='right'
        onDragOver={function (e) {
          /**
           * to prevent additional event processing for this event (such as touch events or pointer events).
           * @link https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
           */
          e.preventDefault()
          // drop effect doesn't affect in dropstart
          // this is so much overhead because dragover is constantly being invoked
          // I don't know why It should be set in dragover
          e.dataTransfer.dropEffect = 'move'
        }}
      >
        <ActionsContainer ref={actionsContainer} offset={config.offset.right}>
          <ActionsHeader
            draggable
            onMouseEnter={function (e) {
              const right = safeGetBody().querySelector('#right') as HTMLElement
              if (!right) return
              right.style.zIndex = '3'
            }}
            onMouseLeave={function (e) {
              const right = safeGetBody().querySelector('#right') as HTMLElement
              if (!right) return
              right.style.zIndex = '1'
            }}
            onDragStart={function (e) {
              y = e.clientY
              // ;(e.currentTarget as HTMLElement).style.cursor = 'grabbing'
            }}
            onDragEnd={function (e) {
              const dy = e.clientY - y
              const { top } = window.getComputedStyle(e.currentTarget.parentElement as HTMLElement)
              const value = parseInt(/-?\d+/.exec(top)![0], 10)
              /**
               * relocating based on the difference from start to end
               * is more accurate than just in coordinate clientY
               */
              const right = `${Math.max(value + dy, 0)}px`
              setState({ config: { ...config, offset: { ...config.offset, right } } })
              // offset.right = `${Math.max(value + dy, 0)}px`
              // ;(e.currentTarget.parentElement as HTMLElement).style.top = offset.right
            }}
          >
            Actions
          </ActionsHeader>
          <ActionsContent>
            {task?.actions.map((a, index) => (
              <TextButton
                key={a.id}
                draggable
                onDragStart={function (e) {
                  e.dataTransfer.dropEffect = 'move'
                }}
                // animate here
                // onDragOver={function() {}}

                onDragEnd={function (e) {
                  e.preventDefault()
                  // setDragTarget(-1)
                  if (swapTarget !== undefined) {
                    const insertUpper = index > swapTarget

                    const sub = insertUpper
                      ? task.actions.slice(swapTarget, index).toSpliced(0, 0, ...task.actions.splice(index, 1))
                      : // without assigning first, It would invoke an error
                        ([...task.actions.slice(index + 1, swapTarget + 1), undefined].with(
                          swapTarget - index,
                          task.actions.splice(index, 1).at(0)
                        ) as InitialActionSchema<ActionPreset>[])

                    // console.log(
                    //   'before: ',
                    //   task.actions.map((as) => as.name)
                    // )
                    // console.log('insertUpper: ', insertUpper)
                    // console.log('index: ', index)
                    // console.log('swapTarget: ', swapTarget)
                    // console.log('sub: ', sub)

                    if (insertUpper) task.actions.splice(swapTarget, sub.length, ...sub)
                    else task.actions.splice(index, sub.length, ...sub)

                    // console.log(
                    //   'after: ',
                    //   task.actions.map((as) => as.name)
                    // )

                    // const t = task.actions[swapTarget]
                    // task.actions[swapTarget] = task.actions[index]
                    // task.actions[index] = t
                  }
                  setActionIndex(-1)
                  setState({ cache: { ...cache } })

                  // console.log('end transfer : ', e.dataTransfer)
                }}
                onDragOver={function (e) {
                  e.preventDefault()
                  swapTarget = index
                  e.dataTransfer.dropEffect = 'move'
                }}
                onMouseUp={function () {
                  setActionIndex(index)
                }}
              >
                <ActionButtonName title={a.name}>{a.name}</ActionButtonName>
              </TextButton>
            ))}
            <SVGButton
              data-desc='액션 추가하기'
              onClick={function (e) {
                setOverlay(
                  <ActionSelector
                    onClick={function (action) {
                      // type guard
                      if (!task) return
                      ;(task as Extract<TaskSchema, { validated: undefined | false }>).actions.push(action)
                      action.name = `${action.template}_${taskRowIndex}${taskColIndex}${task.actions.length}`
                      // value should be undefined at first to invoke init function in designer
                      // action.value = {}
                      // batching is not being made here because of the difference between store and state maybe?
                      setActionIndex(task.actions.length - 1)
                      setOverlay(null)
                      setState({ cache: { ...cache } })
                    }}
                  />
                )
              }}
            >
              <Plus />
            </SVGButton>
          </ActionsContent>
        </ActionsContainer>
      </Right>
      <Left
        id='left'
        onDragOver={function (e) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
      >
        <ContextContainer offset={config.offset.left}>
          <ContextHeader
            draggable
            onMouseEnter={function (e) {
              const left = safeGetBody().querySelector('#left') as HTMLElement
              if (!left) return
              left.style.zIndex = '3'
            }}
            onMouseLeave={function (e) {
              const left = safeGetBody().querySelector('#left') as HTMLElement
              if (!left) return
              left.style.zIndex = '1'
            }}
            onDragStart={function (e) {
              y = e.clientY
            }}
            onDragEnd={function (e) {
              const dy = e.clientY - y
              const { top } = window.getComputedStyle(e.currentTarget.parentElement as HTMLElement)
              const value = parseInt(/-?\d+/.exec(top)![0], 10)
              const left = `${Math.max(value + dy, 0)}px`
              setState({ config: { ...config, offset: { ...config.offset, left } } })
              // offset.left = `${Math.max(value + dy, 0)}px`
              // ;(e.currentTarget.parentElement as HTMLElement).style.top = offset.left
            }}
          >
            Context
          </ContextHeader>
          {/* @ts-ignore */}
          {action && input && <input.design as={action as ActionSchema<GenericAction>} />}
        </ContextContainer>
      </Left>

      <Bottom id='bottom'>
        <SpecificationContainer>
          <SpecificationHeader>
            <NameAndUtilitiesWrapper>
              <SpecUtilities id='as-util'>
                <Shrinker direction='vertical' target={specContainer}>
                  <Extend />
                </Shrinker>

                <SVGButton
                  data-desc='삭제하기'
                  disabled={!action}
                  onClick={function removeCurrentActionSchema() {
                    if (!action || !window.confirm('정말 삭제하시겠습니까?')) return
                    task.actions = task.actions.filter((as) => as !== action)
                    setActionIndex((prev) => prev - 1)
                    setState({ cache: { ...cache } })
                  }}
                >
                  <Minus />
                </SVGButton>
              </SpecUtilities>
              {task?.actions[currentActionIndex]?.name && (
                <>
                  <ActionName
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onBlur={function (e) {
                      const newName = e.currentTarget.textContent || `${action.template}_${task.actions.length}`

                      /**
                       * if action name is used for snapshot key
                       * replace it with new name
                       *
                       * todo:
                       * maybe you need to add method that creates snapshot on each action designer
                       */

                      const prev = task.actions[currentActionIndex].name

                      task.actions[currentActionIndex].name = newName

                      // @ts-ignore
                      if (input.onActionLabelChange) input.onActionLabelChange(action, prev)

                      setState({ cache: { ...cache } })
                    }}
                    onKeyDown={function (e) {
                      // e.preventDefault()
                      const length = e.currentTarget.textContent?.length || 0
                      if (length > 51) {
                        e.currentTarget.textContent = e.currentTarget.textContent!.slice(0, 20)

                        pushMessage({
                          message: '액션 이름은 50자를 넘길 수 없습니다',
                          autoRemove: true,
                          layer: safeGetBody().querySelector('#push')
                        })

                        e.currentTarget.blur()
                      }
                      if (e.key === 'Enter') e.currentTarget.blur()
                    }}
                  >
                    {task.actions[currentActionIndex].name}
                  </ActionName>
                  <TemplateName>{`[${task.actions[currentActionIndex].template}]`}</TemplateName>
                </>
              )}
            </NameAndUtilitiesWrapper>

            <TabContainer>
              {action && (
                <TextButton onClick={decideSpreading}>
                  <SpecificationLabel>Substitution</SpecificationLabel>
                </TextButton>
              )}
            </TabContainer>
          </SpecificationHeader>
          <Content ref={specContainer}>
            {action && input && (
              // @ts-ignore
              <input.specify as={action as ActionSchema<ActionInterfaceSuperset>} />
            )}
          </Content>
        </SpecificationContainer>
      </Bottom>

      {/* <Datalist id={taskId}>
        {(action ? getPreviousSubstitutes(ps, action as ActionSchema) : [])
          .concat(getUpperSubstitutes(ps, task))
          .map((substitute) => (
            <Option key={substitute}>{substitute}</Option>
          ))}
      </Datalist> */}
    </Container>
  )
}

export default Builder

const Container = styled(Div)`
  position: fixed;
  top: 0;
  left: 0;
`

const Top = styled(FlexCenterDiv)`
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  margin: 0 32px;
  position: fixed;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 8px 8px;
`

const Right = styled(FlexDiv)`
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  position: fixed;
`

const Bottom = styled(FlexDiv)`
  bottom: 0;
  left: 0;
  right: 0;
  position: fixed;
  margin: 0 32px;
  z-index: 2;
  height: 250px;
`
const Left = styled(FlexDiv)`
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1;
  position: fixed;
`

const SpecificationContainer = styled(FlexColumnDiv)`
  flex: 1;
  align-items: stretch;
  background-color: white;
  border-radius: 8px 8px 0 0;
  box-shadow: var(--shadow-elevation4);
  min-width: 0;
`
const SpecificationHeader = styled(FlexDiv)`
  height: 60px;
  position: relative;
  align-items: center;
  justify-content: space-between;
  // background-color: var(--color-theme-primary);
  box-shadow: var(--shadow-elevation2);
  -webkit-app-region: drag;
  padding: 0 60px;
  background-color: grey;
  color: white;
  font-size: 24px;
  font-family: fantasy;
  border-radius: 8px 8px 0 0;
`
const SpecUtilities = styled(FlexCenterDiv)`
  & svg {
    width: 20px;
    height: 20px;
  }

  & > * {
    margin-right: 6px;
  }
`

const Content = styled(FlexColumnDiv)`
  // grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  // grid-auto-rows: minmax(100px, auto);
  // gap: 20px;
  flex: 1;
  position: relative;
  z-index: 1;
  min-height: 150px;
  background-color: var(--color-light-grey2);
  padding: 0.5em 0.5em;
  overflow: scroll;
  max-height: 300px;
  ${SCROLL}
`

const ActionsContainer = styled(FlexColumnDiv)<{ offset: string }>`
  align-items: stretch;
  position: relative;
  width: 150px;
  top: ${({ offset }) => offset};
`

const ActionsHeader = styled(FlexCenterDiv)`
  height: 40px;
  position: relative;
  background-color: var(--color-theme-primary);
  box-shadow: var(--shadow-elevation2);
  -webkit-app-region: drag;
  padding: 0 20px;
  background-color: grey;
  color: white;
  font-size: 20px;
  font-family: fantasy;
  border-radius: 16px;
  cursor: grab;
`

const ActionsUtilities = styled(FlexCenterDiv)``

const ActionsContent = styled(FlexColumnDiv)`
  position: relative;
  z-index: 1;
  justify-content: flex-start;
  align-items: stretch;
  // min-height: 200px;
  height: calc(100vh - 350px);
  // background-color: var(--color-light-grey2);
  padding: 0.5em 0.5em;
`

const ActionButtonName = styled(Label)`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const NameAndUtilitiesWrapper = styled(FlexDiv)`
  & > *:not(:first-child) {
    margin-left: 1em;
  }
`

const ActionName = styled(Span)`
  display: flex;
  align-items: center;
  justify-content: center;
`

const TemplateName = styled(Span)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`

const SpecificationLabel = styled(Span)``

const ActionItem = styled(FlexDiv)`
  align-items: center;
  justify-content: space-between;
`

const SpecButton = styled(TextButton)``

const SpecificationKey = styled(Span)``

const SpecificationValue = styled(Span)``

const SpecificationItem = styled(FlexColumnDiv)`
  & > ${SpecificationValue}: nth-child(even) {
    background-color: var(--color-table-row, #f7f7f7);
  }
`

const ContextContainer = styled(FlexColumnDiv)<{ offset: string }>`
  position: relative;
  width: 150px;
  top: ${({ offset }) => offset};
`

const ContextHeader = styled(FlexCenterDiv)`
  height: 40px;
  position: relative;
  background-color: var(--color-theme-primary);
  box-shadow: var(--shadow-elevation2);
  -webkit-app-region: drag;
  padding: 0 20px;
  background-color: grey;
  color: white;
  font-size: 20px;
  font-family: fantasy;
  border-radius: 16px;
  cursor: grab;
`

const TabContainer = styled(FlexDiv)`
  & > button:not(:first-child) {
    margin-left: 4px;
  }
`

const TopLayout = styled(FlexDiv)`
  align-items: center;
  justify-content: space-between;
`
