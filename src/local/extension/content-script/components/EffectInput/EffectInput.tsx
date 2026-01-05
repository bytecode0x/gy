import Form from 'lib/component/Form'
import Select from 'lib/component/Select'
import TabBar from 'lib/component/TabBar'
import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Span, TextArea, TextButton } from 'lib/frame/generic'
import { Border, ElevatedForm, TextAreaLayout1, TextButtonsLayout1 } from 'lib/frame/sementic'
import { Effect } from 'lib/gy/core/type/effect'
import { ProcedureSchema } from 'lib/gy/core/type/procedure'
import { DataTree } from 'lib/gy/core/type/tree'
import { overlayLoader, pushMessage } from 'lib/util/dom/render'

import { CreateScript, GetScript, InvokeEffect, UpdateScript } from 'lib/event/sementic'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import { ComponentProps, FC, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { z } from 'zod'
import shallow from 'zustand/shallow'
import ContextInfo from './ContextInfo'
import Logger from './Logger'
// import 'prismjs/components/prism-clike'
// import 'prismjs/components/prism-javascript'
// you need to append it to styled component global style manually
// import 'prismjs/themes/prism.css'

const Container = styled(ElevatedForm)`
  display: flex;
  width: 800px;
  height: 600px;

  & textarea::placeholder {
    font-size: 28px;
    font-style: italic;
  }
`
const OuterBorder = styled(Border)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  min-height: 0;
  min-width: 0;

  & > *:not(:first-child) {
    margin-top: 12px;
  }
`

const HorizontalLayout = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
  min-width: 0;

  & > *:not(:first-child) {
    margin-left: 4px;
  }
`
const VerticalLayout = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
  min-width: 0;

  & > *:not(:first-child) {
    margin-top: 4px;
  }
`

const FunctionTemplate = styled(Span)``

const ToggleButton = styled(TextButton)<{ switchOn: boolean }>`
  background-color: ${({ switchOn }) => (switchOn ? 'var(--color-bg-primary-offset)' : 'var(--color-bg-primary)')};

  &:hover {
    background-color: ${({ switchOn }) => (switchOn ? 'var(--color-bg-primary)' : 'var(--color-bg-primary-offset)')};
  }
`

const ScriptSequenceLayout = styled(FlexColumnDiv)`
  padding: 4px;

  & > * {
    margin-top: 4px;
  }
`

type EffectInputProps = {
  initial: Effect
  tree: DataTree
  schema: ProcedureSchema
  onResolve: (effect: Effect) => Promise<any>
  onReject: (reason: string) => void
}

const EffectInput: FC<EffectInputProps> = ({ initial, tree, schema, onResolve, onReject }) => {
  const [effect, setEffect] = useState<Effect>({ ...initial })
  const [currentScriptId, setCurrentScriptId] = useState<string>('')
  const [currentSequenceNumber, setCurrentSequenceNumber] = useState<number>(0)
  const [gy, cache, setState] = getStore()(
    useCallback((state) => [state.gy, state.cache, state.setState], []),
    shallow
  )
  /**
   * this should be set through session storage
   */
  const [displayLogger, setDisplayLogger] = useState<boolean>(false)
  const [displayContext, setDisplayContext] = useState<boolean>(false)
  const [log, setLog] = useState<string>('')
  // const [code, setCode] = useState<string>('')

  const preflight = useCallback(
    function () {
      if (!currentScriptId) return

      const evHandler = getEvHandler()

      return evHandler
        .sendEvent<InvokeEffect>({
          name: 'INVOKE_EFFECT',
          payload: {
            effect: {
              config: { disabled: [] },
              __i__scripts: [[effect.__i__scripts.flat().find((sid) => sid === currentScriptId)!]]
              // scriptIds: [effect.scriptIds.find((sid) => sid === currentScriptId)!]
            },
            treePaths: [tree.id],

            $cdr: schema.$cdr,
            idr: schema.idr
          },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })
        .catch(function (err) {
          console.log('preflight err : ', err)
          pushMessage({
            message: `invalid script${err?.message ? `\n${err.message}` : ''}`,
            layer: safeGetBody().querySelector('#push')
          })
          // setLog(err?.message?.split('\n').at(0) || '')
        })
    },
    [effect, currentScriptId]
  )

  const loadScript = useCallback(
    async function () {
      const close = setOverlay(
        <Select
          header='불러올 스크립트를 선택하세요'
          singular
          required
          options={gy.$scripts.map((sd) => sd.sid)}
          labels={gy.$scripts.map((sd) => sd.name)}
          placeholder='저장된 스크립트가 없습니다'
          onReject={function () {
            close()
          }}
          onResolve={async function (chosens) {
            const chosen = chosens[0]

            setEffect({
              ...effect,
              __i__scripts: effect.__i__scripts.with(
                currentSequenceNumber,
                effect.__i__scripts[currentSequenceNumber].concat([chosen])
              )
            })

            // if (effect.scriptIds.every((sid) => sid !== chosen))
            //   setEffect({ ...effect, scriptIds: effect.scriptIds.concat([chosen]) })

            /**
             * no need to fetch here
             * effect(react) will handle
             */

            setCurrentScriptId(chosen)
            close()
          }}
        />
      )
    },
    [effect, gy.$scripts, currentSequenceNumber]
  )

  const createScript = useCallback(
    async function (code: string = '') {
      const name = window.prompt('스크립트 이름을 입력하세요', `Script_${effect.__i__scripts.flat().length + 1}`)

      if (!name) return

      const evHandler = getEvHandler()

      const { descriptor, script } = await evHandler.sendEvent<CreateScript>({
        name: 'CREATE_SCRIPT',
        payload: { name, code },
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })

      setCurrentScriptId(script.id)

      setEffect({
        ...effect,
        __i__scripts: effect.__i__scripts.with(
          currentSequenceNumber,
          effect.__i__scripts[currentSequenceNumber].concat([script.id])
        )
      })

      // setEffect({ ...effect, scriptIds: effect.scriptIds.concat([script.id]) })
      setState({
        cache: { ...cache, scripts: cache.scripts.concat([script]) },
        gy: { ...getStore().getState().gy, $scripts: gy.$scripts.concat([descriptor]) }
      })
    },
    [effect, gy.$scripts, currentSequenceNumber]
  )

  const saveScript = useCallback(
    async function () {
      if (!currentScriptId) return
      const code = (safeGetBody().querySelector(`[id="${currentScriptId}"]`) as HTMLTextAreaElement).value

      const script = cache.scripts.find((script) => script.id === currentScriptId)
      const sr = gy.$scripts.find((sr) => sr.sid === currentScriptId)

      if (!script) throw new Error('EFFECT_INPUT:SAVE_SCRIPT:NO_SCRIPT_MATCHED')
      if (!sr) throw new Error('EFFECT_INPUT:SAVE_SCRIPT:NO_SCRIPT_RECORD_MATCHED')

      script.code = code

      /**
       * you need to save locally here in case of executing right after creating and writing
       */
      const evHandler = getEvHandler()
      await evHandler.sendEvent<UpdateScript>({
        name: 'UPDATE_SCRIPT',
        payload: { partial: script },
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })

      pushMessage({ message: `스크립트 ${sr.name} 저장됨`, layer: safeGetBody().querySelector('#push') })
    },
    [currentScriptId, cache, gy.$scripts]
  )

  const removeScriptFromEffect = useCallback(
    function () {
      if (!currentScriptId) return

      const confirm = window.confirm('스크립트를 이펙트로부터 제거하시겠습니까?\n(스크립트 자체가 삭제되지는 않습니다)')

      if (!confirm) return

      const sr = gy.$scripts.find((sr) => sr.sid === currentScriptId)

      if (!sr) throw new Error('EFFECT_INPUT:REMOVE_SCRIPT:NO_SCRIPT_RECORD_MATCHED')

      // setEffect({ ...effect, scriptIds: effect.scriptIds.filter((sid) => sid !== currentScriptId) })
      setEffect({
        ...effect,
        __i__scripts: effect.__i__scripts.with(
          currentSequenceNumber,
          effect.__i__scripts[currentSequenceNumber].filter((sid) => sid !== currentScriptId)
        )
      })
      setCurrentScriptId('')

      pushMessage({ message: `스크립트 ${sr.name} 삭제됨`, layer: safeGetBody().querySelector('#push') })
    },
    [currentSequenceNumber, currentScriptId, effect, gy.$scripts]
  )

  const setEffectConfig = useCallback(
    function () {
      const revertOverlay = setOverlay(
        <Form
          header='이펙트 상세 설정'
          record={{
            '스크립트 활성화/비활성화': {
              labeler(value) {
                return '클릭하여 설정하세요'
              },
              effect(getter, setter) {
                const scriptRecords = getStore()
                  .getState()
                  .gy.$scripts.filter((sr) => effect.__i__scripts.flat().includes(sr.sid))

                const revertOverlay = setOverlay(
                  <Form
                    record={Object.fromEntries(
                      scriptRecords.map((sr) => [
                        sr.name,
                        {
                          data: JSON.stringify(!!effect.config.disabled.includes(sr.sid)),
                          labeler(value) {
                            return JSON.parse(value) ? '비활성화됨' : '활성화됨'
                          },
                          effect(getter, setter) {
                            const flag = JSON.parse(getter() || 'false')
                            setter(JSON.stringify(!flag))
                          }
                        } as ComponentProps<typeof Form>['record'][string]
                      ])
                    )}
                    header='스크립트의 활성화/비활성화를 설정하세요'
                    onReject={function () {
                      revertOverlay()
                    }}
                    onResolve={function (formData) {
                      effect.config.disabled = scriptRecords
                        .filter((sr) => JSON.parse(formData[sr.name]))
                        .map((sr) => sr.sid)
                      setEffect({ ...effect })
                      revertOverlay()
                    }}
                  />
                )
              }
            }
          }}
          onReject={function () {
            revertOverlay()
          }}
          onResolve={function () {
            revertOverlay()
          }}
        />
      )
    },
    [effect]
  )

  // const configureVariableSpecification = useCallback(
  //   async function () {
  //     const script = cache.scripts.find((script) => script.id === currentScriptId)
  //     const sr = $scripts.find((sr) => sr.sid === currentScriptId)

  //     if (!script) throw new Error('EFFECT_INPUT:SAVE_SCRIPT:NO_SCRIPT_MATCHED')
  //     if (!sr) throw new Error('EFFECT_INPUT:SAVE_SCRIPT:NO_SCRIPT_RECORD_MATCHED')

  //     if (!script.required) script.required = []
  //     if (!script.optional) script.optional = []

  //     const stringifiedRequired = script.required.join(',')
  //     const stringifiedOptional = script.optional.join(',')

  //     const evHandler = getEvHandler()

  //     const revertOverlay = setOverlay(
  //       <Form
  //         header='스크립트 변수 상세'
  //         record={{
  //           required: {
  //             data: stringifiedRequired,
  //             effect(getter, setter) {
  //               const revertOverlay = setOverlay(
  //                 <MatrixInput
  //                   initial={getter()}
  //                   disabled
  //                   evaluate={async function ({ expression }) {
  //                     return expression
  //                   }}
  //                   parse={(raw) =>
  //                     evHandler.sendEvent<Parse>({
  //                       name: 'PARSE',
  //                       payload: { raw, splitWithEscaped: false },
  //                       meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
  //                     })
  //                   }
  //                   onReject={function () {
  //                     revertOverlay()
  //                   }}
  //                   onResolve={function (raw, matrix) {
  //                     revertOverlay()
  //                   }}
  //                 />
  //               )
  //             }
  //           },
  //           optional: {
  //             data: stringifiedOptional,
  //             effect(getter, setter) {
  //               const revertOverlay = setOverlay(
  //                 <MatrixInput
  //                   initial={getter()}
  //                   disabled
  //                   evaluate={async function ({ expression }) {
  //                     return expression
  //                   }}
  //                   parse={(raw) =>
  //                     evHandler.sendEvent<Parse>({
  //                       name: 'PARSE',
  //                       payload: { raw, splitWithEscaped: false },
  //                       meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
  //                     })
  //                   }
  //                   onReject={function () {
  //                     revertOverlay()
  //                   }}
  //                   onResolve={function (raw, matrix) {
  //                     revertOverlay()
  //                   }}
  //                 />
  //               )
  //             }
  //           }
  //         }}
  //         onReject={function () {
  //           revertOverlay()
  //         }}
  //         onResolve={function (formData) {
  //           script.optional = formData.optional.split(',')
  //           script.required = formData.required.split(',')

  //           revertOverlay()
  //         }}
  //       />
  //     )
  //   },
  //   [currentScriptId, cache, $scripts]
  // )

  const copyToClipboard = useCallback(
    function () {
      const ta = safeGetBody().querySelector(`textarea[id="${currentScriptId}"]`) as HTMLTextAreaElement

      if (!ta) return

      navigator.clipboard.writeText(ta.value).then(
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
    [currentScriptId]
  )

  const toggleDisplayLogger = useCallback(function () {
    setDisplayLogger((prev) => !prev)
  }, [])

  const toggleDisplayContext = useCallback(function () {
    setDisplayContext((prev) => !prev)
  }, [])

  useEffect(
    function fetchIfNotInCache() {
      const layout = safeGetBody().querySelector('[id="script-layout"]') as HTMLDivElement
      if (!layout) throw new Error('EFFECT_INPUT:FETCH_SCRIPTS:NO_LAYOUT')
      const revert = overlayLoader(layout)

      const eh = getEvHandler()
      Promise.all(
        effect.__i__scripts
          .flat()
          .filter((sid) => cache.scripts.every((script) => script.id !== sid))
          .map((sid) =>
            eh.sendEvent<GetScript>({
              name: 'GET_SCRIPT',
              payload: { sid },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          )
      )
        .then((scripts) => setState({ cache: { ...cache, scripts: cache.scripts.concat(scripts) } }))
        .finally(revert)
    },
    [effect]
  )

  return (
    <Container
      onSubmit={async function (e) {
        e.preventDefault()

        const layout = safeGetBody().querySelector('[id="script-layout"]') as HTMLDivElement
        if (!layout) throw new Error('EFFECT_INPUT:FETCH_SCRIPTS:NO_LAYOUT')
        const revert = overlayLoader(layout)

        await onResolve(effect).then(revert)
      }}
    >
      <OuterBorder>
        <TextButtonsLayout1>
          <FlexCenterDiv>
            <TextButton type='submit'>확인</TextButton>
            <TextButton
              type='button'
              onClick={function (e) {
                onReject('canceled by user')
              }}
            >
              취소
            </TextButton>
          </FlexCenterDiv>
          <FlexCenterDiv>
            <ToggleButton
              switchOn={displayLogger}
              data-desc='로그 패널을 표시하거나 숨깁니다'
              onClick={toggleDisplayLogger}
              type='button'
            >
              로그
            </ToggleButton>
            <ToggleButton
              switchOn={displayContext}
              data-desc='런타임 컨텍스트를 패널을 표시하거나 숨깁니다'
              onClick={toggleDisplayContext}
              type='button'
            >
              컨텍스트
            </ToggleButton>
            <TextButton
              data-desc='현재 탭에서 스냅샷을 매개변수로 함수를 실행합니다'
              disabled={!currentScriptId}
              onClick={preflight}
              type='button'
            >
              테스트
            </TextButton>
            <TextButton
              data-desc='스크립트를 클립보드로 복사합니다'
              disabled={!currentScriptId}
              onClick={copyToClipboard}
              type='button'
            >
              복사
            </TextButton>
            <TextButton data-desc='저장된 스크립트를 불러옵니다' onClick={loadScript} type='button'>
              불러오기
            </TextButton>
            <TextButton
              data-desc='스크립트를 새로 만듭니다'
              type='button'
              onClick={function () {
                createScript()
              }}
            >
              새로 만들기
            </TextButton>
            <TextButton
              data-desc='스크립트를 저장합니다'
              type='button'
              disabled={!currentScriptId}
              onClick={saveScript}
            >
              저장
            </TextButton>
            <TextButton
              data-desc='스크립트를 다른 이름으로 저장합니다'
              disabled={!currentScriptId}
              type='button'
              onClick={function () {
                if (!currentScriptId) return
                const ta = safeGetBody().querySelector(`[id="${currentScriptId}"]`) as HTMLTextAreaElement
                if (!ta) return
                const code = ta.value
                createScript(code)
              }}
            >
              다른 이름으로 저장
            </TextButton>

            <TextButton
              data-desc='스크립트를 이펙트로부터 제거합니다'
              disabled={!currentScriptId}
              type='button'
              onClick={removeScriptFromEffect}
            >
              삭제
            </TextButton>
            {/* <TextButton
              data-desc='스크립트와 관련된 대체수(Substitute)를 상세합니다'
              type='button'
              onClick={configureVariableSpecification}
            >
              대체수
            </TextButton> */}
            <TextButton data-desc='설정 창을 엽니다' type='button' onClick={setEffectConfig}>
              설정
            </TextButton>
          </FlexCenterDiv>
        </TextButtonsLayout1>

        <ScriptSequenceLayout>
          {effect.__i__scripts.map((sequence, i) => (
            <TabBar
              key={i}
              tabs={sequence
                .map((sid) => gy.$scripts.find((sr) => sr.sid === sid)!)
                .map((sr) => ({ name: sr.name, id: sr.sid }))}
              onActive={function ({ id, name }) {
                setCurrentScriptId(id)
                setCurrentSequenceNumber(i)
              }}
            />
          ))}
        </ScriptSequenceLayout>

        <HorizontalLayout>
          <TextAreaLayout1 id='script-layout'>
            {currentScriptId &&
              (function () {
                const script = cache.scripts.find((script) => script.id === currentScriptId)
                const sr = gy.$scripts.find((sr) => sr.sid === currentScriptId)

                if (!script || !sr) return <></>

                return (
                  <>
                    <FunctionTemplate>{`${sr.name} (tree) {`}</FunctionTemplate>
                    <TextArea
                      ref={function (ta) {
                        if (!ta) return
                        ta.value = script.code
                      }}
                      id={sr.sid}
                      autoFocus
                      spellCheck={false}
                      /**
                       * default value doesn't change in re-render
                       */
                      // defaultValue={script.code}
                      // onChange={(e) => {
                      //   setCode(e.target.value)
                      // }}
                    />
                    {/* <EditorContainer>
              <Editor
              value={code}
                onValueChange={(code) => setCode(code)}
                highlight={(code) => highlight(code, languages.js, 'js')}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 12
                }}
                />
              </EditorContainer> */}
                    <FunctionTemplate>{'}'}</FunctionTemplate>
                  </>
                )
              })()}
          </TextAreaLayout1>
          {displayContext && (
            <ContextInfo
              returnType={{ label: 'any', scheme: z.any() }}
              parameters={[
                { id: 'tree', type: 'DataTree', snapshot: tree },
                { id: 'cdr', type: 'RawDataRecord', snapshot: schema.$cdr },
                { id: 'idr', type: 'DataRecord', snapshot: schema.$idr }
              ]}
              onClick={function (snapshot) {
                if (!displayLogger) return
                setLog(JSON.stringify(snapshot, null, 2))
              }}
            />
          )}
        </HorizontalLayout>
        {displayLogger && (
          <VerticalLayout>
            <Logger log={log} />
          </VerticalLayout>
        )}
      </OuterBorder>
    </Container>
  )
}

export default EffectInput
