import Play from 'lib/asset/svg/Play'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import { FlexColumnDiv, SVGButton, TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { dataRecordSchema, matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { DataRecord } from 'lib/gy/core/type/primitive'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__EvalBindingTab } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Consume, Eval, Interpret, InterpretObj } from 'sementic_events'
import styled from 'styled-components'
import { z } from 'zod'
import shallow from 'zustand/shallow'
import { getEvHandler } from '../event/entity/content-event-handler'
import { SpecificationTable } from '../frames'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

const Layout = styled(FlexColumnDiv)`
  width: 800px;
  height: 600px;
`

export const EVAL_BINDING_TAB: ActionInput<__Action__EvalBindingTab> = {
  help: '주어진 자바스크립트 코드를 메인 프레임 컨텍스트에서 실행합니다',
  template: 'EVAL_BINDING_TAB',
  onActionLabelChange(as, prev) {
    if (!(prev in as.snapshot)) return
    // swap snapshot
    as.snapshot = {
      [as.name]: as.snapshot[prev]
    }

    // swap spread
    as.spread = {
      [as.name]: as.spread[prev]
    }

    // swap scope
    as.scope = {
      [as.name]: as.scope[prev]
    }
  },
  design({ as }) {
    const [cache, setState] = getStore()(
      useCallback((state) => [state.cache, state.setState], []),
      shallow
    )

    const designSchema = useCallback(
      function () {
        const ps = cache.procedures.find((ps) => ps.tasks.flat().some((ts) => ts.actions.includes(as)))

        if (!ps)
          return pushMessage({
            message: 'DESIGNER:EVAL_BINDING_TAB:NO_PROC_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const ts = ps.tasks.flat().find((ts) => ts.actions.includes(as))

        if (!ts)
          return pushMessage({
            message: 'DESIGNER:EVAL_BINDING_TAB:NO_TASK_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const substitutes = getUpperSnapshots(ps, ts)
          .concat(getPreviousSnapshots(ts, as))
          .reduce(
            function (prev, curr) {
              return Object.assign(prev, curr)
            },
            { EXTENSION_TAB: [['-1']] }
            // {}
          )

        const snapshot: DataRecord = {}

        let t_$rendererId = as.value?.rendererId
        let t_$params = as.value?.params

        const evHandler = getEvHandler()

        const revertOverlay = setOverlay(
          <Form
            header='Evaluate binding tab'
            record={{
              code: {
                data: as.value?.code,
                labeler(value) {
                  return '클릭하여 값을 입력하세요'
                },
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Code'
                      initial={{ code: getter() }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ code: $code }, { code }) {
                        // if (typeof code !== 'string')
                        //   return pushMessage({
                        //     message: `code must be string type`,
                        //     layer: safeGetBody().querySelector('#push')
                        //   })

                        // console.log('code: ', code)
                        // console.log('$code: ', $code)

                        setter($code)

                        revertOverlay()
                      }}
                      interpret={async function ($record, log) {
                        // const code = await evHandler.sendEvent<Interpret>({
                        //   name: 'INTERPRET',
                        //   payload: {
                        //     raw,
                        //     header: { edr: substitutes }
                        //   },
                        //   meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                        // })

                        const { code } = $record

                        const params = t_$params
                          ? await evHandler.sendEvent<Interpret>({
                              name: 'INTERPRET',
                              payload: {
                                raw: t_$params,
                                header: { edr: substitutes }
                              },
                              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                            })
                          : []

                        const rendererId = t_$rendererId
                          ? await evHandler.sendEvent<Interpret>({
                              name: 'INTERPRET',
                              payload: {
                                raw: t_$rendererId,
                                header: { edr: substitutes }
                              },
                              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                            })
                          : -1

                        const resolve =
                          t_$rendererId === undefined
                            ? await evHandler.sendEvent<Eval>({
                                name: 'EVAL',
                                payload: {
                                  code,
                                  params: [{ id: 'prxy', value: substitutes }].concat(params),
                                  meta: { edrKey: '0' }
                                },
                                meta: { receiver: { component: 'MAIN_WORLD', id: 0 } }
                              })
                            : await evHandler.sendEvent<Consume<__Action__EvalBindingTab>>({
                                name: 'CONSUME',
                                payload: {
                                  action: {
                                    id: '',
                                    name: '',
                                    schema: '',
                                    state: 'WATING',
                                    template: 'EVAL_BINDING_TAB',
                                    value: {
                                      code,
                                      params,
                                      rendererId
                                    }
                                  },
                                  header: { edr: substitutes }
                                },
                                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                              })

                        log(JSON.stringify(resolve, null, 2))

                        if (matrixSchema.safeParse(resolve).success) {
                          snapshot[as.name] = resolve
                        } else if (dataRecordSchema.safeParse(resolve).success) {
                          Object.assign(snapshot, resolve)
                        } else {
                          pushMessage({
                            message: `the code must return matrix or data record`,
                            layer: safeGetBody().querySelector('#push')
                          })
                          throw new Error('the code must return matrix or data record')
                        }

                        return { code }
                      }}
                    />
                  )
                }
              },
              params: {
                data: as.value?.params,
                labeler(value) {
                  return '클릭하여 값을 입력하세요'
                },
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Parameters'
                      initial={{ params: getter() }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ params: $params }, { params }) {
                        const scheme = z.array(z.object({ id: z.string(), value: z.any() }))

                        if (!scheme.safeParse(params).success)
                          return pushMessage({
                            message: `params must be resolved in type Array<{ id: string; value: any }>`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        t_$params = $params

                        setter($params)

                        revertOverlay()
                      }}
                      interpret={(raw) =>
                        evHandler.sendEvent<InterpretObj>({
                          name: 'INTERPRET_OBJ',
                          payload: {
                            raw,
                            header: { edr: substitutes }
                          },
                          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                        })
                      }
                    />
                  )
                }
              },
              rendererId: {
                data: as.value?.rendererId,
                labeler(value) {
                  return value ? '탭 지정됨' : '탭 지정안됨'
                },
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Tab Id'
                      initial={{ tabId: getter() }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ rendererId: $rendererId }, { tarendererIdbId }) {
                        // if (tabId !== undefined && typeof tabId !== 'number')
                        //   return pushMessage({
                        //     message: `tab id must be resolved in number`,
                        //     layer: safeGetBody().querySelector('#push')
                        //   })

                        t_$rendererId = $rendererId

                        setter($rendererId)

                        revertOverlay()
                      }}
                      interpret={(raw) =>
                        evHandler.sendEvent<InterpretObj>({
                          name: 'INTERPRET_OBJ',
                          payload: {
                            raw,
                            header: { edr: substitutes }
                          },
                          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                        })
                      }
                    />
                  )
                }
              }
            }}
            onReject={function () {
              revertOverlay()
            }}
            onResolve={function (formData) {
              const { code, params, rendererId } = formData

              as.value = { code, params, rendererId }
              as.snapshot = { ...as.snapshot, ...snapshot }

              setState({ cache: { ...cache } })
              revertOverlay()
            }}
          />
        )
      },
      [as, cache]
    )

    useEffect(function init() {
      if (as.value !== undefined) return
      designSchema()
    })

    return createPortal(
      <SVGButton
        data-desc='수정하기'
        // disabled={!action}
        onClick={designSchema}
      >
        <Play />
      </SVGButton>,
      safeGetBody().querySelector('#as-util')!
    )
  },
  specify({ as }) {
    return (
      <SpecificationTable>
        <TableBody>
          <TableRow>
            {['키', '값'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          {as.snapshot &&
            Object.entries(as.snapshot).map(([key, value]) => (
              <TableRow key={key}>
                <TableData>{key}</TableData>
                <TableData title={JSON.stringify(value)}>{JSON.stringify(value)}</TableData>
              </TableRow>
            ))}
        </TableBody>
      </SpecificationTable>
    )
  }
}
