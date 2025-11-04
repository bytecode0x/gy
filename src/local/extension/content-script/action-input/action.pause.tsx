import { TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { __Action__Pause } from 'local/desktop/main/gy/type/action.preset'
import { useCallback, useEffect } from 'react'
import { SpecificationTable } from '../frames'
import { ActionInput } from './type'

export const PAUSE: ActionInput<__Action__Pause> = {
  help: 'Pause a procedure',
  template: 'PAUSE',

  design({ as }) {
    const designSchema = useCallback(
      function () {
        if (!as.value) as.value = {}

        /**
         * todo
         * let user decide resume key
         * you need to elaborate dialog logic first
         */
      },
      [as]
    )

    useEffect(function init() {
      if (as.value !== undefined) return

      designSchema()
    })

    return <></>
  },
  specify({ as }) {
    return (
      <SpecificationTable>
        <TableBody>
          <TableRow>
            {['값'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          <TableRow>
            <TableData>{`프로시져를 일시정지 합니다\nAlt+Ctrl+P 버튼을 눌러 세션을 재개할 수 있습니다`}</TableData>
          </TableRow>
        </TableBody>
      </SpecificationTable>
    )
  }
}
