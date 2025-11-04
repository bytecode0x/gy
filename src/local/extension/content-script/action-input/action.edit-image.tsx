import Play from 'lib/asset/svg/Play'
import { SVGButton } from 'lib/frame/generic'
import { pushMessage } from 'lib/util/dom/render'
import { __Action__EditImage } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getEvHandler } from '../event/entity/content-event-handler'
import { getPreviousSnapshots, getUpperSnapshots } from '../functions'
import { safeGetBody } from '../functions/app'
import { getStore, setOverlay } from '../store'
import { ActionInput } from './type'

export const EDIT_IMAGE: ActionInput<__Action__EditImage> = {
  help: '주어진 리스트 중에서 값을 선택합니다',
  template: 'EDIT_IMAGE',
  onActionLabelChange(as, prev) {},
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

        const revertOverlay = setOverlay(<></>)
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
    return <></>
  }
}
