import Play from 'lib/asset/svg/Play'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import { SVGButton, TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__LoadUrl } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { InterpretObj } from 'sementic_events'
import { getEvHandler } from '../event/entity/content-event-handler'
import { SpecificationTable } from '../frames'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

export const LOAD_URL: ActionInput<__Action__LoadUrl> = {
  help: '',
  template: 'LOAD_URL',
  onActionLabelChange(as, prev) {
    // swap snapshot
    as.snapshot = {
      [as.name]: as.snapshot[prev],
      [`${as.name}$renderer_id`]: as.snapshot[`${prev}$renderer_id`]
    }

    // swap spread
    as.spread = {
      [as.name]: as.spread[prev],
      [`${as.name}$renderer_id`]: as.spread[`${prev}$renderer_id`]
    }

    // swap scope
    as.scope = {
      [as.name]: as.scope[prev],
      [`${as.name}$renderer_id`]: as.scope[`${prev}$renderer_id`]
    }
  },
  design({ as }) {
    const designSchema = useCallback(
      function () {
        const { cache, setState } = getStore().getState()

        const ps = cache.procedures.find((ps) => ps.tasks.flat().some((ts) => ts.actions.includes(as)))

        if (!ps)
          return pushMessage({
            message: 'DESIGNER:LOAD_URL:NO_PROC_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const ts = ps.tasks.flat().find((ts) => ts.actions.includes(as))

        if (!ts)
          return pushMessage({
            message: 'DESIGNER:LOAD_URL:NO_TASK_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const substitutes = getUpperSnapshots(ps, ts)
          .concat(getPreviousSnapshots(ts, as))
          .reduce(function (prev, curr) {
            return Object.assign(prev, curr)
          }, {})

        console.log('substitutes: ', substitutes)

        const evHandler = getEvHandler()

        const snapshot: Record<string, any> = { ...as.snapshot }

        const revertOverlay = setOverlay(
          <Form
            header='값을 입력하세요'
            record={{
              url: {
                data: as.value?.url,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='URL'
                      initial={{ url: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ url: $url }, { url }) {
                        if (typeof url !== 'string')
                          return pushMessage({
                            message: `url must be resolved in string`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        setter($url)
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
              find: {
                data: as.value?.find,
                effect(getter, setter) {
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='document url patterns'
                      initial={{ pattern: getter() || '' }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ pattern: $pattern }, { pattern }) {
                        if (typeof pattern !== 'string')
                          return pushMessage({
                            message: `url pattern must be resolved in string`,
                            layer: safeGetBody().querySelector('#push')
                          })

                        setter($pattern)
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
              through: {
                data: as.value?.through || 'tab',
                effect(getter, setter, remove) {
                  const through = getter()

                  const literal = ['tab', 'internal']

                  const idx = literal.findIndex((v) => v === through)

                  const next = literal[((idx ?? 0) + 1) % literal.length]

                  setter(next)
                },
                labeler(value) {
                  return value
                }
              }
            }}
            onReject={function () {
              revertOverlay()
            }}
            onResolve={function (formData) {
              as.value = { url: formData.url, find: formData.find, through: formData.through || 'tab' }
              as.snapshot = {
                [as.name]: [[formData.url]],
                [`${as.name}$renderer_id`]: [['-1']],
                [`${as.name}$through`]: [[formData.through]]
              }
              as.scope = { [`${as.name}$renderer_id`]: 'private', [`${as.name}$through`]: 'private' }
              as.spread = {}
              setState({ cache: { ...cache } })

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
  specify({ as }) {
    return (
      <SpecificationTable>
        <TableBody>
          <TableRow>
            {['URL'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          <TableRow>
            <TableData>{as.value?.url}</TableData>
          </TableRow>
        </TableBody>
      </SpecificationTable>
    )
  }
}
