import { TableBody, TableData, TableHeader, TableRow } from 'lib/frame/generic'
import { __Action__Extract } from 'local/desktop/main/gy/type/action.preset'
import { useEffect } from 'react'
import { SpecificationTable } from '../frames'
import { getStore } from '../store'
import { ActionInput } from './type'

export const EXTRACT: ActionInput<__Action__Extract> = {
  help: '정규표현식을 이용해 주어진 값에서 특정 문자열만 추출합니다',
  template: 'EXTRACT',
  design({ as }) {
    useEffect(function () {
      if (as.value) return
      const pattern = window.prompt('정규 표현식을 입력하세요') || ''
      const text = window.prompt('추출 대상을 입력하세요') || ''
      as.value = { pattern, text }

      // implement later

      const { cache, setState } = getStore().getState()

      setState({ cache: { ...cache } })
    }, [])
    return <></>
  },
  specify({ as }) {
    // const extract = pattern.exec(text)
    return (
      <SpecificationTable>
        <TableBody>
          <TableRow>
            {['정규표현식', '대상', '추출된 값'].map((key, index) => (
              <TableHeader key={index}>{key}</TableHeader>
            ))}
          </TableRow>
          <TableRow>
            <TableData>{as.value.pattern}</TableData>
            <TableData>{as.value.text}</TableData>
            <TableData>{new RegExp(as.value.pattern).exec(as.value.text)}</TableData>
          </TableRow>
        </TableBody>
      </SpecificationTable>
    )
  }
}
