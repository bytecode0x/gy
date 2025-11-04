import Play from 'lib/asset/svg/Play'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import { SVGButton, TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__Define } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { InterpretObj } from 'sementic_events'
import { z } from 'zod'
import shallow from 'zustand/shallow'
import { getEvHandler } from '../event/entity/content-event-handler'
import { SpecificationTable } from '../frames'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

export const DEFINE: ActionInput<__Action__Define> = {
  help: '대체수(Substitute)를 정의합니다',
  template: 'DEFINE',
  onActionLabelChange(as, prev) {
    // swap snapshot
    as.snapshot = {
      [as.name]: as.snapshot[prev],
      [`${as.name}$confirm`]: as.snapshot[`${prev}$confirm`],
      [`${as.name}$title`]: as.snapshot[`${prev}$title`]
    }

    // swap spread
    as.spread = {
      [as.name]: as.spread[prev],
      [`${as.name}$confirm`]: as.spread[`${prev}$confirm`],
      [`${as.name}$title`]: as.spread[`${prev}$title`]
    }

    // swap scope
    as.scope = {
      [as.name]: as.scope[prev],
      [`${as.name}$confirm`]: as.scope[`${prev}$confirm`],
      [`${as.name}$title`]: as.scope[`${prev}$title`]
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
            message: 'DESIGNER:DEFINE:NO_PROC_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const ts = ps.tasks.flat().find((ts) => ts.actions.includes(as))

        if (!ts)
          return pushMessage({
            message: 'DESIGNER:DEFINE:NO_TASK_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const substitutes = getUpperSnapshots(ps, ts)
          .concat(getPreviousSnapshots(ts, as))
          .reduce(function (prev, curr) {
            return Object.assign(prev, curr)
          }, {})

        const evHandler = getEvHandler()

        const snapshot: Record<string, any> = {}

        const revertOverlay = setOverlay(
          <Form
            header='Define'
            record={{
              record: {
                data: as.value?.record || {},
                labeler(value) {
                  return '클릭하여 값을 정의하세요'
                },
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Record'
                      configurable
                      initial={getter() || {}}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function (record, interpretedRecord) {
                        for (const [key, value] of Object.entries(interpretedRecord)) {
                          if (!matrixSchema.safeParse(value).success && !value)
                            return pushMessage({
                              message: `entry ${key} is not being resolved in matrix or empty`,
                              layer: safeGetBody().querySelector('#push')
                            })
                          snapshot[key] = value
                        }

                        console.log(`raw string input resolved\nrecord: ${record}\ninterpreted: ${interpretedRecord}`)

                        setter(record)
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
                labeler(value) {
                  return snapshot[`${as.name}$confirm`]?.at(0)?.at(0) === '$<json|parse|true>'
                    ? '런타임중 값을 확인합니다'
                    : '런타임중 값을 확인하지 않습니다'
                },
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Confirm'
                      initial={{ confirm: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ confirm: $confirm }, { confirm }) {
                        if (!z.boolean().optional().safeParse(confirm).success)
                          return pushMessage({
                            message: `property confirm is being resolved in wrong type`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        snapshot[`${as.name}$confirm`] = [[`$<json|parse|${JSON.stringify(confirm)}>`]]
                        setter($confirm)
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
              title: {
                data: as.value?.title,
                labeler(value) {
                  return snapshot[`${as.name}$title`] || as.name
                },
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Title'
                      initial={{ title: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ title: $title }, { title }) {
                        if (!z.string().optional().safeParse(title).success)
                          return pushMessage({
                            message: `property confirm is being resolved in wrong type`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        snapshot[`${as.name}$title`] = [[JSON.stringify(title)]]
                        setter($title)
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
            onResolve={async function (formData) {
              const { confirm, record } = formData

              as.value = { confirm, record }
              as.snapshot = { ...as.snapshot, ...snapshot }

              console.log(`define schema resolved\nas: ${as}`)

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
                <TableData>{value}</TableData>
              </TableRow>
            ))}
        </TableBody>
      </SpecificationTable>
    )
  }
}
