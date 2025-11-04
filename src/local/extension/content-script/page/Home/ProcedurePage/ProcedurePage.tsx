import Download from 'lib/asset/svg/Download'
import Plus from 'lib/asset/svg/Plus'
import { FlexDiv, SVGButton } from 'lib/frame/generic'
import { ProcedureSchema } from 'lib/gy/core/type/procedure'
import ProcedureComponent from 'local/extension/content-script/components/Procedure'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore } from 'local/extension/content-script/store'
import { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CreateProcedureSchema } from 'sementic_events'
import styled from 'styled-components'
import { v4 } from 'uuid'
import shallow from 'zustand/shallow'

const Container = styled(FlexDiv)`
  gap: 15px 15px;
  flex-wrap: wrap;
  // align-items: stretch;
  // flex: 1;
  padding: 12px;
`

const ProcedurePage = () => {
  const [gy, cache, setState] = getStore()(
    useCallback((state) => [state.gy, state.cache, state.setState], []),
    shallow
  )

  // const downloadProcedure = useCallback(
  //   function () {
  //     const evHandler = getEvHandler()
  //     setOverlay(
  //       <Form
  //         record={{
  //           pid: {
  //             effect(getter, setter) {
  //               const pid = window.prompt('불러오고자 하는 Procedure 의 ID 를 입력하세요')
  //               const scheme = z.string().uuid()
  //               const parse = scheme.safeParse(pid)

  //               // console.log('returnValue : ', returnValue)

  //               if ('error' in parse) {
  //                 return parse.error.issues.forEach(({ path, message }) =>
  //                   pushMessage({
  //                     message: `올바른 값이 아닙니다`,
  //                     layer: safeGetBody().querySelector('#push')
  //                   })
  //                 )
  //               }

  //               setter(pid!)
  //             }
  //           }
  //         }}
  //         header=''
  //         onReject={function () {
  //           setOverlay(null)
  //         }}
  //         onResolve={function (formData) {
  //           evHandler
  //             .sendEvent<Pipe<DownloadProcedureSchema>>({
  //               name: 'PIPE',
  //               payload: {
  //                 name: 'DOWNLOAD_PROCEDURE_SCHEMA',
  //                 payload: formData.pid,
  //                 meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  //               },
  //               meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
  //             })
  //             .then(function (proc) {
  //               procs.push({
  //                 ...proc,
  //                 id: v4(),
  //                 triggers: [],
  //                 config: { preserveTree: true, strict: false, invokeEffectImmediately: true }
  //               })
  //               setState({ procedureSchemas: procs.slice() })
  //             })
  //             .catch(function (err) {
  //               pushMessage({
  //                 message: '에러가 발생했습니다\n해당 프로시져가 없거나 잘못된 ID 입니다',
  //                 layer: safeGetBody().querySelector('#push')
  //               })
  //             })

  //             .finally(function () {
  //               /**
  //                * this will prevent users from sending multiple requests simultaneously
  //                */
  //               setOverlay(null)
  //             })
  //         }}
  //       />
  //     )
  //   },
  //   [procs]
  // )

  const addProcedure = useCallback(
    async function () {
      const evHandler = getEvHandler()

      const schema: ProcedureSchema = {
        name: `Procedure_${gy.$procedures.length}`,
        $cdr: {},
        $constraint: '',
        constraint: [],
        $idr: {},
        id: v4(),
        idr: {},
        links: [],
        tasks: []
      }

      const { descriptor } = await evHandler.sendEvent<CreateProcedureSchema>({
        name: 'CREATE_PROCEDURE_SCHEMA',
        payload: { schema },
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })

      setState({
        gy: {
          ...gy,

          $procedures: gy.$procedures.concat(descriptor)
        },
        cache: { ...cache, procedures: cache.procedures.concat(schema) }
      })
    },
    [gy.$procedures, cache]
  )

  return (
    <Container>
      {createPortal(
        <>
          <SVGButton data-desc2='추가하기' onClick={addProcedure}>
            <Plus />
          </SVGButton>

          <SVGButton
            data-desc2='불러오기'
            // onClick={process.env.NODE_ENV === 'devserver' ? undefined : downloadProcedure}
          >
            <Download />
          </SVGButton>
        </>,
        safeGetBody().querySelector('#gu')!
      )}
      {gy.$procedures.map((pd, index) => (
        <ProcedureComponent pd={pd} key={pd.pid} />
      ))}
    </Container>
  )
}
export default ProcedurePage
