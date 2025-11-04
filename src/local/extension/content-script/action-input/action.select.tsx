import Play from 'lib/asset/svg/Play'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import { Colgroup, Column, SVGButton, TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { Matrix } from 'lib/gy/core/type/primitive'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__Select } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { InterpretObj } from 'sementic_events'
import { SNAPSHOT_MAX_DATA_LENGTH, SNAPSHOT_MAX_ROW_LENGTH } from '../const'
import { getEvHandler } from '../event/entity/content-event-handler'
import { SpecificationTable } from '../frames'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

export const SELECT: ActionInput<__Action__Select> = {
  help: '주어진 리스트 중에서 값을 선택합니다',
  template: 'SELECT',
  onActionLabelChange(as, prev) {
    // swap snapshot
    as.snapshot = {
      [as.name]: as.snapshot[prev],
      [`${as.name}$labels`]: as.snapshot[`${prev}$labels`],
      [`${as.name}$indices`]: as.snapshot[`${prev}$indices`]
    }

    // swap spread
    as.spread = {
      [as.name]: as.spread[prev],
      [`${as.name}$labels`]: as.spread[`${prev}$labels`],
      [`${as.name}$indices`]: as.spread[`${prev}$indices`]
    }

    // swap scope
    as.scope = {
      [as.name]: as.scope[prev],
      [`${as.name}$labels`]: as.scope[`${prev}$labels`],
      [`${as.name}$indices`]: as.scope[`${prev}$indices`]
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
          .reduce(
            function (prev, curr) {
              return Object.assign(prev, curr)
            },
            {}
            // { EXTENSION_TAB: [['-1']] }
          )

        console.log('substitutes: ', substitutes)

        const evHandler = getEvHandler()

        const snapshot: Record<string, any> = { ...as.snapshot }

        const revertOverlay = setOverlay(
          <Form
            header='Select'
            record={{
              options: {
                data: as.value?.options,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Options'
                      initial={{ options: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ options: $options }, { options }) {
                        if (!matrixSchema.safeParse(options).success)
                          return pushMessage({
                            message: `options must be resolved in matrix`,
                            layer: safeGetBody().querySelector('#push')
                          })
                        snapshot[as.name] = (options as Matrix)
                          .slice(0, SNAPSHOT_MAX_ROW_LENGTH)
                          .map((row) =>
                            row.map((value) =>
                              value.length > SNAPSHOT_MAX_DATA_LENGTH
                                ? value.slice(0, SNAPSHOT_MAX_DATA_LENGTH).concat('...')
                                : value
                            )
                          )

                        snapshot[`${as.name}$indices`] = Array.from({ length: SNAPSHOT_MAX_ROW_LENGTH }, (_, i) => [
                          i.toString()
                        ])

                        setter($options)
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
              labels: {
                data: as.value?.labels,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Labels'
                      initial={{ labels: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ labels: $labels }, { labels }) {
                        if (!matrixSchema.safeParse(labels).success)
                          return pushMessage({
                            message: `labels must be resolved in matrix`,
                            layer: safeGetBody().querySelector('#push')
                          })
                        snapshot[`${as.name}$labels`] = (labels as Matrix)
                          .slice(0, SNAPSHOT_MAX_ROW_LENGTH)
                          .map((row) =>
                            row.map((value) =>
                              value.length > SNAPSHOT_MAX_DATA_LENGTH
                                ? value.slice(0, SNAPSHOT_MAX_DATA_LENGTH).concat('...')
                                : value
                            )
                          )

                        setter($labels)
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
              attach: {
                data: as.value?.attach,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Attach'
                      configurable
                      initial={{ attach: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ attach: $attach }, { attach }) {
                        if (typeof attach !== 'number')
                          return pushMessage({
                            message: `tab id must be resolved in number`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        snapshot[`${as.name}$attach`] = $attach

                        setter($attach)
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
              console.log('select schema value: ', formData)

              as.value = { options: formData.options, labels: formData.labels, attach: formData.attach }

              console.log('old snapshot: ', { ...as.snapshot })
              console.log('new snapshot: ', snapshot)

              as.snapshot = { ...as.snapshot, ...snapshot }
              console.log('merged snapshot: ', as.snapshot)

              as.spread = Object.fromEntries(Object.keys(as.snapshot).map((key) => [key, false]))

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
            {['options', 'labels', 'attach'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          {as.snapshot && (
            <TableRow>
              {as.snapshot[as.name] && (
                <TableData title={JSON.stringify(as.snapshot.options)}>{as.snapshot.options}</TableData>
              )}
              {as.snapshot[`${as.name}$labels`] && (
                <TableData title={JSON.stringify(as.snapshot.labels)}>{as.snapshot.labels}</TableData>
              )}
              <TableData title={JSON.stringify(as.snapshot.attach || '')}>{as.snapshot.attach || ''}</TableData>
            </TableRow>
          )}
        </TableBody>
      </SpecificationTable>
    )
  }
}
