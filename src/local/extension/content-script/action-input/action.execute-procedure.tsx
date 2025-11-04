import Play from 'lib/asset/svg/Play'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import Select from 'lib/component/Select'
import { SVGButton, TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__InitiateProcedure } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { InterpretObj } from 'sementic_events'
import { getEvHandler } from '../event/entity/content-event-handler'
import { SpecificationTable } from '../frames'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

export const INITIATE_PROCEDURE: ActionInput<__Action__InitiateProcedure> = {
  help: 'execute a procedure',
  template: 'INITIATE_PROCEDURE',
  onActionLabelChange(as, prev) {
    // [`${as.name}$pid`]: [[pid]],
    // [`${as.name}$tree`]: [[`${as.name}_tid_placeholder`]],
    // [`${as.name}$script_returns`]: [[`${as.name}_scripts_return_values_placeholder`]]

    // swap snapshot
    as.snapshot = {
      [`${as.name}$pid`]: as.snapshot[`${prev}$pid`],
      [`${as.name}$tree`]: as.snapshot[`${prev}$tree`],
      [`${as.name}$script_returns`]: as.snapshot[`${prev}$script_returns`]
    }

    // swap spread
    as.spread = {
      [`${as.name}$pid`]: as.spread[`${prev}$pid`],
      [`${as.name}$tree`]: as.spread[`${prev}$tree`],
      [`${as.name}$script_returns`]: as.spread[`${prev}$script_returns`]
    }

    // swap scope
    as.scope = {
      [`${as.name}$pid`]: as.scope[`${prev}$pid`],
      [`${as.name}$tree`]: as.scope[`${prev}$tree`],
      [`${as.name}$script_returns`]: as.scope[`${prev}$script_returns`]
    }
  },
  design({ as }) {
    const designSchema = useCallback(function () {
      const { cache, gy, setState } = getStore().getState()

      const { $procedures } = gy

      const ps = cache.procedures.find((ps) => ps.tasks.flat().some((ts) => ts.actions.includes(as)))

      if (!ps)
        return pushMessage({
          message: 'DESIGNER:EXECUTE_PROCEDURE:NO_PROC_SCHEMA_MATCHED',
          layer: safeGetBody().querySelector('#push')
        })

      const ts = ps.tasks.flat().find((ts) => ts.actions.includes(as))

      if (!ts)
        return pushMessage({
          message: 'DESIGNER:EXECUTE_PROCEDURE:NO_TASK_SCHEMA_MATCHED',
          layer: safeGetBody().querySelector('#push')
        })

      const substitutes = getUpperSnapshots(ps, ts)
        .concat(getPreviousSnapshots(ts, as))
        .reduce(function (prev, curr) {
          return Object.assign(prev, curr)
        }, {})

      const evHandler = getEvHandler()

      const snapshot: Record<string, any> = {}

      setOverlay(
        <Form
          header='Select a procedure to execute and the options'
          record={{
            Procedure: {
              data: as.value?.pid,
              labeler(value) {
                return $procedures.find((pr) => pr.pid === value)?.name || '알 수 없음'
              },
              modal(getter, setter, close) {
                return (
                  <Select
                    header='Select a procedure'
                    options={$procedures.map((pr) => pr.pid)}
                    labels={$procedures.map((pr) => pr.name)}
                    singular
                    required
                    onReject={function () {
                      close()
                    }}
                    onResolve={function (chosens, indices) {
                      setter(chosens[0])

                      close()
                    }}
                  />
                )
              }
            },
            'Initial data record': {
              data: as.value?.idr,
              labeler(value) {
                return value ? 'Set' : 'Click to set'
              },
              effect(getter, setter) {
                const revertOverlay = setOverlay(
                  <RawStringInput
                    header='Set Initial data record'
                    configurable
                    initial={getter() || {}}
                    onReject={function () {
                      revertOverlay()
                    }}
                    onResolve={function ($idr, idr) {
                      for (const [key, value] of Object.entries(idr)) {
                        if (!matrixSchema.safeParse(value).success)
                          return pushMessage({
                            message: `entry ${key} is not being resolved in matrix`,
                            layer: safeGetBody().querySelector('#push')
                          })
                      }

                      console.log(`raw string input resolved\n$idr: ${$idr}\idr: ${idr}`)

                      setter($idr)
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
            'Execute effect': {
              // '이펙트 실행 여부': {
              data: as.value?.config?.invokeEffectImmediately,
              labeler(value) {
                return value ? 'Executing' : 'Not executing'
                // return value ? '이펙트 실행함' : '이펙트 실행안함'
              },
              effect(getter, setter) {
                console.log('effect : ', getter(), !getter())
                setter(!getter())
                // need to set state to invoke rerender ? NO
                // setState({ procedureSchemas: procedureSchemas.slice() })
              }
            },
            // '이펙트 대기 여부': {
            //   data: as.value?.config?.waitOnEffectResolved,
            //   labeler(value) {
            //     return value ? '이펙트가 끝날 때까지 기다림' : '이펙트가 끝날 때까지 기다리지 않음'
            //   },
            //   effect(getter, setter) {
            //     setter(!getter())
            //   }
            // },
            'Preserve tree': {
              // '트리 보존 여부': {
              data: as.value?.config?.preserveTree,
              labeler(value) {
                // return value ? '트리 저장함' : '트리 저장안함'
                return value ? 'Preserving' : 'Not preserving'
              },
              effect(getter, setter) {
                setter(!getter())
              }
            }
            // '알림 메시지': {
            //   data: as.value?.config?.silenced,
            //   labeler(value) {
            //     return value ? '표시하지 않음' : '표시함'
            //   },
            //   effect(getter, setter) {
            //     setter(!getter())
            //   }
            // }
          }}
          onReject={function () {
            setOverlay(null)
          }}
          onResolve={function (formData) {
            const pid = formData.Procedure

            if (!pid)
              return pushMessage({
                // message: '프로시져 값은 반드시 지정해야 합니다',
                message: 'You must select a procedure',
                layer: safeGetBody().querySelector('#push')
              })

            as.value = {
              pid,
              idr: formData.IDR,
              config: {
                invokeEffectImmediately: formData['Execute Effect'],
                // waitOnEffectResolved: formData['이펙트 대기 여부'],
                preserveTree: formData['Preserve tree']
                // silenced: formData['알림 메시지']
              }
            }
            as.snapshot = {
              [`${as.name}$pid`]: [[pid]],
              [`${as.name}$tree`]: [[`${as.name}_tree_placeholder`]],
              [`${as.name}$script_returns`]: [[`${as.name}_scripts_return_values_placeholder`]]
            }

            console.log('execute procedure design snapshot : ', as.snapshot)

            setState({ cache: { ...cache } })
            setOverlay(null)
          }}
        />
      )
    }, [])

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
            {['Procedure'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          {as.value?.pid && (
            <TableRow>
              <TableData>
                {
                  getStore()
                    .getState()
                    .gy.$procedures.find((pr) => pr.pid === as.value.pid)!.name
                }
              </TableData>
            </TableRow>
          )}
          {/* {as.snapshot[as.name] &&
            as.snapshot[as.name].map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((value, colIndex) => (
                  <TableData key={colIndex}>{value}</TableData>
                ))}
              </TableRow>
            ))} */}
        </TableBody>
      </SpecificationTable>
    )
  }
}
