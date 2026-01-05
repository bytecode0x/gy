import HorizontalThreeDots from 'lib/asset/svg/HorizontalThreeDots'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import {
    CopyProcedure,
    GetProcedureSchema,
    // GetTreeDescriptors,
    InitializeProcess,
    InterpretObj,
    InvokeEffect,
    MergeTrees,
    Pipe,
    QueryTreeAll,
    RemoveProcedures,
    RemoveTrees,
    SetTreeDescriptorName,
    UpdateProcedureDescriptor,
    UpdateProcedureSchema,
    UpdateScript
} from 'lib/event/sementic'
import {
    FlexCenterDiv,
    FlexColumnCenterDiv,
    FlexColumnDiv,
    FlexDiv,
    Span,
    SVGButton,
    TextButton
} from 'lib/frame/generic'
import { DataNode } from 'lib/gy/core/class/data-node'
import { matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { DataRecord } from 'lib/gy/core/type/primitive'
import { ProcedureDescriptor, ProcedureSchema } from 'lib/gy/core/type/procedure'
import { pushMessage } from 'lib/util/dom/render'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { getPseudoDataTreeSnapshot, getSubstitutesOn } from 'local/extension/content-script/functions'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import TriggerPage from 'local/extension/content-script/page/Home/TriggerPage'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import { ComponentProps, FC, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import EffectInput from '../EffectInput'
import PaperBox from '../PaperBox'
import ProcedureSpecification from '../ProcedureSpecification'
import TreeManager from '../TreeManager'

export type ProcedureProps = {
  pd: ProcedureDescriptor<TriggerPreset>
}

const Procedure: FC<ProcedureProps> = ({ pd }) => {
  // const [dropDownLayout, setDropDownLayout] = useState<HTMLElement | null>(null)
  const [dropDownLayout, setDropDownLayout] = useState<boolean>(false)

  const navigate = useNavigate()
  const toBuilder: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    async function (e) {
      const { cache } = getStore().getState()
      if (cache.procedures.every((ps) => ps.id !== pd.pid)) {
        const evHandler = getEvHandler()
        const schema = await evHandler.sendEvent<GetProcedureSchema>({
          name: 'GET_PROCEDURE_SCHEMA',
          payload: { pid: pd.pid },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })
        cache.procedures.push(schema)
      }
      navigate(`/procedure/flow/${pd.pid}`)
    },
    [pd]
  )

  const executeProc: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    async function (e) {
      e.preventDefault()
      const res = window.confirm(`Run the procedure(${pd.name})?${pd.descriptive ? `\n${pd.descriptive}` : ''}`)
      if (!res) return
      // console.log('request to register proc')
      const evHandler = getEvHandler()

      const { cache } = getStore().getState()

      const ps = cache.procedures.find((ps) => ps.id === pd.pid)

      if (ps)
        await evHandler.sendEvent<UpdateProcedureSchema>({
          name: 'UPDATE_PROCEDURE_SCHEMA',
          payload: { schema: ps },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })

      const scripts = cache.scripts.filter((script) => pd.effect.__i__scripts.flat().includes(script.id))

      if (scripts.length)
        await Promise.all(
          scripts.map((script) =>
            evHandler.sendEvent<UpdateScript>({
              name: 'UPDATE_SCRIPT',
              payload: { partial: script },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          )
        )

      return evHandler.sendEvent<InitializeProcess>({
        name: 'INITIALIZE_PROCESS',
        payload: { pid: pd.pid },
        meta: { receiver: { alias: 'MAIN', component: 'MAIN' } }
      })
    },
    [pd]
  )

  const removeProc: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      if (!window.confirm('정말 삭제하시겠습니까?')) return
      const { gy, cache, setState } = getStore().getState()

      const evHandler = getEvHandler()

      return evHandler
        .sendEvent<RemoveProcedures>({
          name: 'REMOVE_PROCEDURES',
          payload: [pd.pid],
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })
        .then(function () {
          setState({
            gy: { ...gy, $procedures: gy.$procedures.filter((_) => _ !== pd) },

            cache: { ...cache, procedures: cache.procedures.filter((p) => p.id !== pd.pid) }
          })
        })
    },
    [pd]
  )

  const defineEffect: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    async function () {
      const evHandler = getEvHandler()
      const { cache, setState } = getStore().getState()
      const ps: ProcedureSchema =
        cache.procedures.find((_) => _.id === pd.pid) || process.env.NODE_ENV !== 'devserver'
          ? await evHandler
              .sendEvent<GetProcedureSchema>({
                name: 'GET_PROCEDURE_SCHEMA',
                payload: { pid: pd.pid },
                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
              })
              .then(function (ps) {
                setState({ cache: { ...cache, procedures: cache.procedures.concat([ps]) } })
                return ps
              })
          : {
              name: '',
              id: 'fortest',
              tasks: [],
              links: [],
              $cdr: {},
              $idr: {},
              idr: {},
              $constraint: '',
              constraint: []
            }

      // console.log('ps: ', pd.name, ps)
      const tree = getPseudoDataTreeSnapshot(ps)

      const revertOverlay = setOverlay(
        <EffectInput
          initial={pd.effect}
          schema={ps}
          onReject={function () {
            revertOverlay()
          }}
          onResolve={async function (effect) {
            // const footer = safeGetBody().querySelector('[id="footer"]') as HTMLDivElement
            // if (!footer) throw new Error('PROCEDURE:DEFINE_EFFECT:NO_FOOTER_FOUND')
            // const revert = overlayLoader(footer)

            pd.effect = effect

            const evHandler = getEvHandler()

            await evHandler.sendEvent<UpdateProcedureDescriptor>({
              name: 'UPDATE_PROCEDURE_DESCRIPTOR',
              payload: { partial: pd },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })

            // revert()

            const { gy, setState } = getStore().getState()
            setState({ gy: { ...gy } })
            revertOverlay()
          }}
          tree={tree}
        />
      )
    },
    [pd]
  )

  const overlayTriggerPage: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      const revert = setOverlay(
        <TriggerPage
          pd={pd}
          onClose={function () {
            revert()
          }}
        />
      )
    },
    [pd]
  )

  const copyProcedure = useCallback(
    function () {
      const evHandler = getEvHandler()
      evHandler
        .sendEvent<CopyProcedure>({
          name: 'COPY_PROCEDURE',
          payload: { pid: pd.pid },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })
        .then(function ({ descriptor, schema }) {
          const { gy, cache, setState } = getStore().getState()

          gy.$procedures.splice(gy.$procedures.findIndex((_) => _.pid === pd.pid) + 1, 0, descriptor)
          cache.procedures.push(schema)

          setState({
            gy: { ...gy },
            cache: { ...cache }
          })
        })

      // copy.links = proc.links.map((link, row) =>
      //   link.map(function (l) {
      //     const srcCol = proc.tasks[row].findIndex((t) => t.id === l.src)
      //     const destCol = proc.tasks[row + 1].findIndex((t) => t.id === l.dest)

      //     if (srcCol === undefined || destCol === undefined)
      //       throw new Error(`failed to copy proc ${proc.name}\ninvalid link`)

      //     return { ...l, src: copy.tasks[row][srcCol].id, dest: copy.tasks[row + 1][destCol].id }
      //   })
      // )
    },
    [pd]
  )

  const invokeEffect = useCallback(
    async function () {
      const evHandler = getEvHandler()

      /**
       * later
       */

      // const r_trees = await evHandler.sendEvent<FetchTreeDescriptors>({
      //   name: 'FETCH_TREE_RECORDS',
      //   payload: {},
      //   meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
      // })

      setOverlay(
        <TreeManager
          $procedures={getStore().getState().gy.$procedures}
          fetcher={function (options, index) {
            return evHandler.sendEvent<Pipe<QueryTreeAll>>({
              name: 'PIPE',
              payload: {
                name: 'QUERY_TREE_ALL',
                payload: { index, queryParams: options, unit: 50 },
                meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
              },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          }}
          namer={function (tid, name) {
            return evHandler.sendEvent<Pipe<SetTreeDescriptorName>>({
              name: 'PIPE',
              payload: {
                name: 'SET_TREE_RECORD_NAME',
                payload: { tid, name },
                meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
              },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          }}
          merger={function (atid) {
            return evHandler.sendEvent<Pipe<MergeTrees>>({
              name: 'PIPE',
              payload: {
                name: 'MERGE_TREES',
                payload: { atid, root: new DataNode({ id: '0', idr: {}, cdr: getStore().getState().gy.gdr }) },
                meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
              },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          }}
          remover={function (atid) {
            return evHandler.sendEvent<Pipe<RemoveTrees>>({
              name: 'PIPE',
              payload: {
                name: 'REMOVE_TREES',
                payload: atid,
                meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
              },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          }}
          onResolve={async function (chosens) {
            const { cache, setState } = getStore().getState()

            let ps = cache.procedures.find((_) => _.id === pd.pid)

            if (!ps)
              ps =
                process.env.NODE_ENV !== 'devserver'
                  ? await evHandler.sendEvent<GetProcedureSchema>({
                      name: 'GET_PROCEDURE_SCHEMA',
                      payload: { pid: pd.pid },
                      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                    })
                  : {
                      name: '',
                      id: 'fortest',
                      tasks: [],
                      links: [],
                      $cdr: {},
                      $idr: {},
                      idr: {},
                      $constraint: '',
                      constraint: []
                    }

            evHandler.sendEvent<InvokeEffect>({
              name: 'INVOKE_EFFECT',
              payload: {
                effect: pd.effect,
                idr: ps.idr,
                $cdr: ps.$cdr,
                treePaths: Array.from(chosens)
              },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })

            setOverlay(null)
          }}
        />
      )
    },
    [pd]
  )

  const showSpecification = useCallback(
    function () {
      const revert = setOverlay(
        <ProcedureSpecification
          pd={pd}
          onResolve={function () {
            revert()
          }}
        />,
        function () {
          console.log('ol cleared')
          const evHandler = getEvHandler()
          evHandler.sendEvent<UpdateProcedureDescriptor>({
            name: 'UPDATE_PROCEDURE_DESCRIPTOR',
            payload: { partial: pd },
            meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
          })
        }
      )
    },
    [pd]
  )

  const config$Cdr = useCallback(
    async function () {
      const evHandler = getEvHandler()

      const { cache, setState } = getStore().getState()
      let ps = cache.procedures.find((_) => _.id === pd.pid)

      if (!ps)
        ps =
          process.env.NODE_ENV !== 'devserver'
            ? await evHandler.sendEvent<GetProcedureSchema>({
                name: 'GET_PROCEDURE_SCHEMA',
                payload: { pid: pd.pid },
                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
              })
            : {
                name: '',
                id: 'fortest',
                tasks: [],
                links: [],
                $cdr: {},
                $idr: {},
                idr: {},
                $constraint: '',
                constraint: []
              }

      if (!ps.$cdr) ps.$cdr = {}

      const revertOverlay = setOverlay(
        <Form
          header='Context Data Record'
          configurable
          defaultSchema={function () {
            return {
              data: '',
              modifable: true,
              effect(getter, setter) {
                /**
                 * children inside modal already rendered before opening modal
                 * It might be better to render on effect ?
                 */
                const revertOverlay = setOverlay(
                  <>
                    <RawStringInput
                      header='Context Data Record'
                      initial={{ entry: getter() }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ entry }, { entry: $entry }) {
                        setter(entry)

                        revertOverlay()
                      }}
                      interpret={(raw) =>
                        evHandler.sendEvent<InterpretObj>({
                          name: 'INTERPRET_OBJ',
                          payload: {
                            raw,
                            header: { edr: {} }
                          },
                          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                        })
                      }
                    />
                    <FlexColumnCenterDiv style={{ marginLeft: '10px' }}>
                      <PaperBox
                        header='Substitutes'
                        content={getSubstitutesOn(ps).join('\n')}
                        width={200}
                        height={275}
                      />
                    </FlexColumnCenterDiv>
                  </>
                )
              }
            }
          }}
          record={Object.fromEntries(
            Object.entries(ps.$cdr).map(([key, data]) => [
              key,
              {
                data,
                modifiable: true,
                effect(getter, setter) {
                  /**
                   * children inside modal already rendered before opening modal
                   * It might be better to render on effect ?
                   */
                  const revertOverlay = setOverlay(
                    <RawStringInput
                      header='Context Data Record'
                      initial={{ entry: getter() }}
                      onReject={function () {
                        revertOverlay()
                      }}
                      onResolve={function ({ entry }, { entry: $entry }) {
                        setter(entry)

                        revertOverlay()
                      }}
                      interpret={(raw) =>
                        evHandler.sendEvent<InterpretObj>({
                          name: 'INTERPRET_OBJ',
                          payload: {
                            raw,
                            header: { edr: {} }
                          },
                          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                        })
                      }
                    />
                  )
                }
              } as ComponentProps<typeof Form>['record'][string]
            ])
          )}
          onReject={function () {
            revertOverlay()
          }}
          onResolve={async function (formData) {
            // const entries = await Promise.all(
            //   Object.entries(formData).map(([key, value]) =>
            //     Promise.all([
            //       Promise.resolve(key),
            //       evHandler.sendEvent<Parse>({
            //         name: 'PARSE',
            //         payload: { raw: value, splitWithEscaped: false },
            //         meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            //       })
            //     ])
            //   )
            // )

            // const idr = Object.fromEntries(entries)

            ps.$cdr = formData

            revertOverlay()

            if (!cache.procedures.find((_) => _.id === ps.id))
              setState({ cache: { ...cache, procedures: cache.procedures.concat([ps]) } })
            else setState({ cache: { ...cache } })

            console.log('defined idr: ', ps)
          }}
        />
      )
    },
    [pd]
  )

  const configIdr = useCallback(
    async function () {
      const evHandler = getEvHandler()

      const { cache, setState } = getStore().getState()
      let ps = cache.procedures.find((_) => _.id === pd.pid)

      if (!ps)
        ps =
          process.env.NODE_ENV !== 'devserver'
            ? await evHandler.sendEvent<GetProcedureSchema>({
                name: 'GET_PROCEDURE_SCHEMA',
                payload: { pid: pd.pid },
                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
              })
            : {
                name: '',
                id: 'fortest',
                tasks: [],
                links: [],
                $cdr: {},
                $idr: {},
                idr: {},
                $constraint: '',
                constraint: []
              }

      if (!ps.$idr) ps.$idr = {}

      const idrSnapshot: DataRecord = { ...ps.idr }

      const revertOverlay = setOverlay(
        <>
          <RawStringInput
            header='Intial Data Record'
            initial={ps.$idr}
            configurable
            onReject={function () {
              revertOverlay()
            }}
            onResolve={function ($idr, idr) {
              for (const [substitute, matrix] of Object.entries(idr))
                if (!matrixSchema.safeParse(matrix).success)
                  return pushMessage({
                    message: `${substitute} is being resolved in wrong type\nIt must be resolved in matrix type`,
                    layer: safeGetBody().querySelector('#push')
                  })

              ps.idr = idr
              ps.$idr = $idr

              if (!cache.procedures.find((_) => _.id === ps.id))
                setState({ cache: { ...cache, procedures: cache.procedures.concat([ps]) } })
              else setState({ cache: { ...cache } })

              revertOverlay()
            }}
            interpret={(raw) =>
              evHandler.sendEvent<InterpretObj>({
                name: 'INTERPRET_OBJ',
                payload: {
                  raw,
                  header: { edr: {} }
                },
                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
              })
            }
          />
          <FlexColumnCenterDiv style={{ marginLeft: '10px' }}>
            <PaperBox header='Substitutes' content={getSubstitutesOn(ps).join('\n')} width={200} height={275} />
          </FlexColumnCenterDiv>
        </>
      )

      // const revertOverlay = setOverlay(
      //   <Form
      //     header='Intial Data Record'
      //     designer={function (key) {
      //       return {
      //         data: '',
      //         modifable: true,
      //         effect(getter, setter) {
      //           const revertOverlay = setOverlay(
      //             <>
      //               <RawStringInput
      //                 header='Intial Data Record'
      //                 initial={{ entry: getter() }}
      //                 onReject={function () {
      //                   revertOverlay()
      //                 }}
      //                 onResolve={function ({ entry }, { entry: $entry }) {
      //                   if (!matrixSchema.safeParse($entry).success)
      //                     return pushMessage({
      //                       message: `It must be resolved in matrix type`,
      //                       layer: safeGetBody().querySelector('#push')
      //                     })

      //                   idrSnapshot[key] = $entry

      //                   setter(entry)

      //                   revertOverlay()
      //                 }}
      //                 interpret={(raw) =>
      //                   evHandler.sendEvent<Interpret>({
      //                     name: 'INTERPRET',
      //                     payload: {
      //                       raw,
      //                       header: { edr: {} }
      //                     },
      //                     meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      //                   })
      //                 }
      //               />
      //               <FlexColumnCenterDiv style={{ marginLeft: '10px' }}>
      //                 <PaperBox
      //                   header='Substitutes'
      //                   content={getSubstitutesOn(ps).join('\n')}
      //                   width={200}
      //                   height={275}
      //                 />
      //               </FlexColumnCenterDiv>
      //             </>
      //           )
      //         }
      //       }
      //     }}
      //     record={Object.fromEntries(
      //       Object.entries(ps.$idr).map(([key, data]) => [
      //         key,
      //         {
      //           data,
      //           modifiable: true,
      //           effect(getter, setter) {
      //             const revertOverlay = setOverlay(
      //               <>
      //                 <RawStringInput
      //                   header='Intial Data Record'

      //                   initial={{ [key]: getter() }}
      //                   onReject={function () {
      //                     revertOverlay()
      //                   }}
      //                   onResolve={function ({ entry }, { entry: $entry }) {
      //                     if (!matrixSchema.safeParse($entry).success)
      //                       return pushMessage({
      //                         message: `${key} is being resolved in wrong type\nIt must be resolved in matrix type`,
      //                         layer: safeGetBody().querySelector('#push')
      //                       })

      //                     idrSnapshot[key] = $entry

      //                     setter(entry)

      //                     revertOverlay()
      //                   }}
      //                   interpret={(raw) =>
      //                     evHandler.sendEvent<Interpret>({
      //                       name: 'INTERPRET',
      //                       payload: {
      //                         raw,
      //                         header: { edr: {} }
      //                       },
      //                       meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      //                     })
      //                   }
      //                 />
      //                 <FlexColumnCenterDiv style={{ marginLeft: '10px' }}>
      //                   <PaperBox
      //                     header='Substitutes'
      //                     content={getSubstitutesOn(ps).join('\n')}
      //                     width={200}
      //                     height={275}
      //                   />
      //                 </FlexColumnCenterDiv>
      //               </>
      //             )
      //           }
      //         } as ComponentProps<typeof Form>['record'][string]
      //       ])
      //     )}
      //     onReject={function () {
      //       revertOverlay()
      //     }}
      //     onResolve={async function (formData) {
      //       ps.$idr = formData
      //       ps.idr = idrSnapshot

      //       console.log('defined idr: ', ps)

      //       revertOverlay()
      //     }}
      //   />
      // )
    },
    [pd]
  )

  const setConstraint = useCallback(
    async function () {
      const evHandler = getEvHandler()

      const { cache, gy, setState } = getStore().getState()
      let ps = cache.procedures.find((_) => _.id === pd.pid)

      if (!ps)
        ps =
          process.env.NODE_ENV !== 'devserver'
            ? await evHandler.sendEvent<GetProcedureSchema>({
                name: 'GET_PROCEDURE_SCHEMA',
                payload: { pid: pd.pid },
                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
              })
            : {
                name: '',
                id: 'fortest',
                tasks: [],
                links: [],
                $cdr: {},
                $idr: {},
                idr: {},
                $constraint: '',
                constraint: []
              }

      if (!ps.$constraint) ps.$constraint = ''

      // const stringifiedConstraint = await evHandler.sendEvent<Stringify>({
      //   name: 'STRINGIFY',
      //   payload: { data: ps.constraint, joinWithEscaped: false },
      //   meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      // })

      const revertOverlay = setOverlay(
        <RawStringInput
          header='Constraint'
          initial={{ entry: ps.$constraint }}
          onReject={function () {
            revertOverlay()
          }}
          onResolve={function ({ entry: $constraint }, { entry: constraint }) {
            if (!matrixSchema.safeParse(constraint).success)
              return pushMessage({
                message: `constraint must be resolved in matrix`,
                layer: safeGetBody().querySelector('#push')
              })

            ps.$constraint = $constraint
            ps.constraint = constraint

            if (!cache.procedures.find((_) => _.id === ps.id))
              setState({ cache: { ...cache, procedures: cache.procedures.concat([ps]) } })
            else setState({ cache: { ...cache } })

            revertOverlay()
          }}
          interpret={(raw) =>
            evHandler
              .sendEvent<InterpretObj>({
                name: 'INTERPRET_OBJ',
                payload: {
                  raw
                },
                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
              })
              .then((r) => r || [[]])
          }
        />
      )
    },
    [pd]
  )

  // later
  // const validate = useCallback(
  //   function () {
  //     return (
  //       proc.tasks.some((l) => l.some((t) => !t.validated)) ||
  //       proc.tasks.length === 0 ||
  //       proc.tasks.flat().flatMap((t) => t.actions).length === 0
  //     )
  //   },
  //   [proc]
  // )

  const setEditable: React.MouseEventHandler<HTMLDivElement> = useCallback(function (e) {
    ;(e.target as HTMLDivElement).setAttribute('contenteditable', 'true')
    ;(e.target as HTMLDivElement).focus()
  }, [])

  const setProcName: React.FocusEventHandler<HTMLDivElement> = useCallback(
    function (e) {
      e.target.setAttribute('contenteditable', 'false')
      const { gy, cache, setState } = getStore().getState()
      pd.name = e.currentTarget.textContent || `Procedure_${gy.$procedures.length}`

      const psInCache = cache.procedures.find((p) => p.id === pd.pid)

      if (psInCache) psInCache.name = pd.name

      const eh = getEvHandler()

      eh.sendEvent<UpdateProcedureDescriptor>({
        name: 'UPDATE_PROCEDURE_DESCRIPTOR',
        payload: { partial: pd },
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })

      setState({ gy: { ...gy } })
    },
    [pd]
  )

  const handleNameChange: React.KeyboardEventHandler<HTMLDivElement> = useCallback(function (e) {
    const length = e.currentTarget.textContent?.length || 0
    if (length > 51) {
      e.currentTarget.textContent = e.currentTarget.textContent!.slice(0, 20)
      pushMessage({
        message: '이름은 50자를 넘길 수 없습니다',
        autoRemove: true,
        layer: safeGetBody().querySelector('#push')
      })
      e.currentTarget.blur()
    }
    if (e.key === 'Enter') e.currentTarget.blur()
  }, [])

  const nameRef = useRef<HTMLDivElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(function () {
    if (!nameRef.current?.textContent) nameRef.current?.click()
    if (containerRef.current && 'scrollIntoViewIfNeeded' in containerRef.current)
      // @ts-ignore
      containerRef.current.scrollIntoViewIfNeeded()
  }, [])

  return (
    <Container id={pd.pid} ref={containerRef} active={!!dropDownLayout}>
      <Name
        title={pd.name}
        ref={nameRef}
        suppressContentEditableWarning
        // placeholder='프로시져 이름을 입력하세요'
        onClick={setEditable}
        onBlur={setProcName}
        onKeyDown={handleNameChange}
        autoCorrect='false'
      >
        {pd.name}
      </Name>

      {dropDownLayout && (
        <DropdownContainer
          autoFocus
          onBlur={function (e) {
            setDropDownLayout(false)
          }}
          // onClick={function () {
          // useless unless capture it on bubbling
          //   setDropdownToggle(false)
          // }}
        >
          <MenuOption data-desc2='프로시져(Procedure)를 실행합니다' onClick={executeProc} disabled={undefined}>
            <Span>Execute Procedure</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져(Procedure)를 정의합니다' onClick={toBuilder}>
            <Span>Define Procedure</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져를 실행시킬 트리거(Trigger)를 정의합니다' onClick={overlayTriggerPage}>
            <Span>Define Trigger</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져가 완료된 이후 실행할 이펙트(Effect)를 정의합니다' onClick={defineEffect}>
            <Span>Define Effect</Span>
          </MenuOption>

          <MenuOption data-desc2='저장된 트리(Tree)에 대해 이펙트(Effect)를 실행합니다' onClick={invokeEffect}>
            <Span>Invoke Effect</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져의 초기 데이터 레코드(IDR)을 설정합니다' onClick={configIdr}>
            <Span>Set Idr</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져의 컨텍스트 데이터 레코드($CDR)을 설정합니다' onClick={config$Cdr}>
            <Span>Set Cdr</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져의 제약(Constraint)을 설정합니다' onClick={setConstraint}>
            <Span>Set Constraint</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져(Procedure)를 복사합니다' onClick={copyProcedure}>
            <Span>Copy</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져(Procedure)를 삭제합니다' onClick={removeProc}>
            <Span>Remove</Span>
          </MenuOption>

          <MenuOption data-desc2='프로시져(Procedure)의 상세(Specification)를 띄웁니다' onClick={showSpecification}>
            <Span>Specification</Span>
          </MenuOption>
        </DropdownContainer>
      )}

      <ToolsContainer>
        <UtilityButton
          onClick={function (e) {
            // const layout = createAppendingContainerWithRelativeCoordinates(
            //   (e.target as HTMLElement).parentElement!.parentElement!,
            //   'bottomright',
            //   false,
            //   safeGetBody().querySelector('#content-middle') as HTMLElement
            // )
            setDropDownLayout((prev) => !prev)
          }}
        >
          <HorizontalThreeDots />
        </UtilityButton>
      </ToolsContainer>
    </Container>
  )
}

export default Procedure

const Container = styled(FlexDiv)<{ active: boolean }>`
  height: 60px;
  width: 200px;
  padding: 16px;
  // border: 1px solid var(--color-border-base);
  box-shadow: var(--shadow-elevation);
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-radius: 8px;
  position: relative;
  z-index: ${({ active }) => (active ? '1' : '0')};

  // & + & {
  //   margin-left: 6px;
  // }
`

const DropdownContainer = styled(FlexColumnDiv)`
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background-color: grey;
  width: 200px;
  font-size: 15px;

  border-radius: 4px;
  padding: 4px;
  background: white;
  box-shadow: var(--shadow-elevation3);
`

const MenuOption = styled(TextButton)`
  justify-content: start;
`

const ToolsContainer = styled(FlexCenterDiv)`
  & > svg {
    width: 18px;
    height: 18px;
  }
`

const Name = styled(FlexDiv)`
  flex: 1;
  align-items: center;
  font-size: 1.25em;
  border-radius: 6px;
  padding: 5px 10px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const UtilityButton = styled(SVGButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 10px;
  background-color: white;

  &[disabled] > svg {
    color: grey;
  }

  & > svg {
    width: 20px;
    height: 20px;
  }
`
