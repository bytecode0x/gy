import Play from 'lib/asset/svg/Play'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import { Colgroup, Column, SVGButton, TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__OpenAIAssistant } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { InterpretObj } from 'sementic_events'
import { getEvHandler } from '../event/entity/content-event-handler'
import { SpecificationTable } from '../frames'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

export const OPEN_AI_ASSISTANT: ActionInput<__Action__OpenAIAssistant> = {
  help: '주어진 리스트 중에서 값을 선택합니다',
  template: 'OPEN_AI_ASSISTANT',
  onActionLabelChange(as, prev) {
    // swap snapshot
    as.snapshot = {
      [as.name]: as.snapshot[prev],
      [`${as.name}$thread`]: as.snapshot[`${prev}$thread`],
      [`${as.name}$dataset`]: as.snapshot[`${prev}$dataset`]
    }

    // swap spread
    as.spread = {
      [as.name]: as.spread[prev],
      [`${as.name}$thread`]: as.spread[`${prev}$thread`],
      [`${as.name}$dataset`]: as.spread[`${prev}$dataset`]
    }

    // swap scope
    as.scope = {
      [as.name]: as.scope[prev],
      [`${as.name}$thread`]: as.scope[`${prev}$thread`],
      [`${as.name}$dataset`]: as.scope[`${prev}$dataset`]
    }
  },
  design({ as }) {
    const designSchema = useCallback(
      function () {
        // console.log('select designer as : ', as)

        const { cache, setState } = getStore().getState()

        const ps = cache.procedures.find((ps) => ps.tasks.flat().some((ts) => ts.actions.includes(as)))

        if (!ps)
          return pushMessage({
            message: 'DESIGNER:SELECT:NO_PROC_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const ts = ps.tasks.flat().find((ts) => ts.actions.includes(as))

        if (!ts)
          return pushMessage({
            message: 'DESIGNER:SELECT:NO_TASK_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const substitutes = getUpperSnapshots(ps, ts)
          .concat(getPreviousSnapshots(ts, as))
          .reduce(function (prev, curr) {
            return Object.assign(prev, curr)
          }, {})

        const evHandler = getEvHandler()

        const revertOverlay = setOverlay(
          <Form
            header='값을 입력하세요'
            record={{
              'api key': {
                data: as.value?.options.apiKey,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='API Key'
                      initial={{ apiKey: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ apiKey }, { options: $apiKey }) {
                        if (typeof $apiKey !== 'string')
                          return pushMessage({
                            message: `api key must be resolved in string`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        setter(apiKey)
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
              'assistant id': {
                data: as.value?.options.assistantId,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Assistant Id'
                      initial={{ assistantId: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ assistantId }, { options: $assistantId }) {
                        if (typeof $assistantId !== 'string')
                          return pushMessage({
                            message: `assistant id must be resolved in string`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        setter(assistantId)
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
              'initial message': {
                data: as.value?.options.initialMessage,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Initial Message'
                      initial={{ initialMessage: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ initialMessage }, { options: $initialMessage }) {
                        if (typeof $initialMessage !== 'string')
                          return pushMessage({
                            message: `initial message must be resolved in string`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        setter(initialMessage)
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
              model: {
                data: as.value?.options.model,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Model'
                      initial={{ model: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ model }, { options: $model }) {
                        if (typeof $model !== 'string')
                          return pushMessage({
                            message: `model must be resolved in string`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        setter(model)
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
              confirm: {
                data: as.value?.confirm,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Confirm'
                      initial={{ confirm: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ confirm }, { options: $confirm }) {
                        if (typeof $confirm !== 'boolean' || $confirm !== undefined)
                          return pushMessage({
                            message: `confirm must be resolved in boolean or undefined`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        setter(confirm)
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
            onResolve={async function (formData) {
              as.value = {
                options: {
                  apiKey: formData['api key'],
                  assistantId: formData['assistant id'],
                  model: formData.model,
                  initialMessage: formData['initial message']
                },
                confirm: formData.confirm
              }

              as.snapshot = { [as.name]: [[`${as.name} assistant data`]] }

              setState({ cache: { ...cache } })
              revertOverlay()
            }}
            onReject={function (reason) {
              revertOverlay()
            }}
          />
        )
      },
      [as]
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
  /**
   * specification with array type should be formed in table
   * which is, in this action, 1 column in '값' and multiple rows in value of items
   */
  specify({ as }) {
    return (
      <SpecificationTable>
        <Colgroup>
          <Column span={1} css={{ minHeight: '32px;' }} />
        </Colgroup>
        <TableBody>
          <TableRow>
            {['api key', 'assistant id', 'model', 'confirm', 'initial message'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          {as.value?.options && (
            <TableRow>
              <TableData title={as.value.options.apiKey}>{as.value.options.apiKey}</TableData>

              <TableData title={as.value.options.assistantId}>{as.value.options.assistantId}</TableData>

              <TableData title={as.value.options.model || undefined}>{as.value.options.model}</TableData>

              <TableData title={as.value?.confirm || 'false'}>{as.value?.confirm || 'false'}</TableData>

              <TableData title={as.value.options.initialMessage}>{as.value.options.initialMessage}</TableData>
            </TableRow>
          )}
        </TableBody>
      </SpecificationTable>
    )
  }
}
