import Play from 'lib/asset/svg/Play'
import { SVGButton, TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__Type } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import StringInput from '../components/StringInput'
import { SpecificationTable } from '../frames'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

export const TYPE: ActionInput<__Action__Type> = {
  help: '키보드 값을 입력합니다',
  template: 'TYPE',
  onActionLabelChange(as, prev) {
    const value = as.snapshot[prev]
    if (!value) return
    const flag = as.spread[prev]

    as.snapshot = { [as.name]: value }
    as.spread = { [as.name]: flag }
  },

  design({ as }) {
    const designSchema = useCallback(
      function () {
        const { cache, setState } = getStore().getState()

        const ps = cache.procedures.find((ps) => ps.tasks.flat().some((ts) => ts.actions.includes(as)))

        if (!ps)
          return pushMessage({
            message: 'DESIGNER:SCRAPE:NO_PROC_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const ts = ps.tasks.flat().find((ts) => ts.actions.includes(as))

        if (!ts)
          return pushMessage({
            message: 'DESIGNER:SCRAPE:NO_TASK_SCHEMA_MATCHED',
            layer: safeGetBody().querySelector('#push')
          })

        const snapshot = getUpperSnapshots(ps, ts)
          .concat(getPreviousSnapshots(ts, as))
          .reduce(function (prev, curr) {
            return Object.assign(prev, curr)
          }, {})

        setOverlay(
          <StringInput
            initial={as.value?.value}
            snapshot={snapshot}
            placeholder='키보드 입력을 설정하세요'
            onReject={function () {
              setOverlay(null)
            }}
            onResolve={function (raw) {
              if (!as.value) as.value = { value: '' }
              as.value.value = raw
              setOverlay(null)
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
    // const extract = pattern.exec(text)
    return (
      <SpecificationTable>
        <TableBody>
          <TableRow>
            {['값'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          <TableRow>
            <TableData>{as.value.value}</TableData>
          </TableRow>
        </TableBody>
      </SpecificationTable>
    )
  }
}
