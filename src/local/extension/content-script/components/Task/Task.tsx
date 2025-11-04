import GreaterThan from 'lib/asset/svg/GreaterThan'
import LessThan from 'lib/asset/svg/LessThan'
import Minus from 'lib/asset/svg/Minus'
import Network2 from 'lib/asset/svg/Network2'
import Route from 'lib/asset/svg/Route'
import Write from 'lib/asset/svg/Write'
import Form from 'lib/component/Form'
import { FlexCenterDiv, FlexColumnCenterDiv, FlexColumnDiv, SVGButton } from 'lib/frame/generic'
import { Link } from 'lib/gy/core/type/link'
import { ProcedureSchema } from 'lib/gy/core/type/procedure'
import { TaskSchema } from 'lib/gy/core/type/task'
import { SCROLL } from 'lib/styled-css-property'
import { pushMessage } from 'lib/util/dom/render'
import { SmallRoundButton } from 'local/extension/content-script/frames'
import { getUpperSnapshots } from 'local/extension/content-script/functions'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import { ComponentProps, FC, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { v4 } from 'uuid'
import { z } from 'zod'
import shallow from 'zustand/shallow'
import FunctionCreator from '../FunctionCreator'

const UtilityContainer = styled(FlexColumnCenterDiv)`
  position: absolute;
  right: 0;
  top: 4px;
  display: none;
`

const Container = styled(FlexCenterDiv)`
  position: relative;
  padding: 0 24px;

  &:hover > ${UtilityContainer} {
    display: flex;
  }
`

const UtilityButton = styled(SVGButton)<{ reverse?: boolean }>`
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

  & + & {
    margin-left: 6px;
  }

  background-color: var(${({ reverse }) => (reverse ? '--color-bg-primary-offset' : '--color-bg-primary')});
`

const TaskContainer = styled(FlexColumnDiv)`
  border-radius: 6px;
  align-items: stretch;
  width: 250px;
  background-color: white;
  box-shadow: var(--shadow-elevation4);
`

const Header = styled(FlexCenterDiv)`
  font-size: 1em;
  border-bottom: 1px solid var(--color-border-base);
  min-height: 30px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding: 4px;
`

const Content = styled(FlexCenterDiv)`
  max-height: 200px;
  min-height: 100px;
  // overflow: scroll;
  // overflow make it ignore parent's radius
  // border-radius: 0 0 6px 6px;

  ${SCROLL}
`

const PredicationLayout = styled(FlexColumnDiv)`
  width: 600px;
  height: 600px;
`

export type TaskProps = {
  ts: TaskSchema
  // prev?: TaskSchema
  // next?: TaskSchema
}

const Task: FC<TaskProps> = ({ ts }) => {
  const [cache, procs, setState] = getStore()(
    useCallback((state) => [state.cache, state.cache.procedures, state.setState], []),
    shallow
  )

  // const insertBefore: React.MouseEventHandler<HTMLButtonElement> = useCallback(
  //   function (e) {
  //     const proc = procs.find((p) => p.tasks.includes(ts))
  //     if (!proc) return
  //     const index = proc.tasks.findIndex((t) => t === ts)
  //     proc.tasks.splice(index, 0, { id: v4(), name: `new task${index}`, actions: [], validated: false, map: {} })
  //     setState({ procedures: procs.slice() })
  //   },
  //   [procs]
  // )

  // const insertBottom: React.MouseEventHandler<HTMLButtonElement> = useCallback(
  //   function (e) {
  //     const proc = procs.find((p) => p.tasks.flat().includes(ts))
  //     if (!proc) return
  //     const currLayer = proc.tasks.findIndex((l) => l.includes(curr))
  //     proc.tasks[currLayer].push({ id: v4(), name: `task${currLayer + 1}_0`, actions: [], validated: false, map: {} })
  //     setState({ procedures: procs.slice() })
  //   },
  //   [procs]
  // )

  const sort = useCallback(function (proc: ProcedureSchema) {
    console.log('sorting tasks')

    proc.tasks.reduce(function (parents, children, childrenIndex) {
      return children.sort(function (a, b) {
        const parentA = proc.tasks[childrenIndex - 1].find(
          (p) => p.id === proc.links[childrenIndex - 1].find((l) => l.dest === a.id)!.src
        )
        const parentB = proc.tasks[childrenIndex - 1].find(
          (p) => p.id === proc.links[childrenIndex - 1].find((l) => l.dest === b.id)!.src
        )
        if (parentA === parentB) return a.createdAt - b.createdAt
        return parents.findIndex((p) => p === parentA) - parents.findIndex((p) => p === parentB)
      })
    })

    // sorting leaf nodes
    const links = proc.links.flat().map((l) => l.src)
    proc.tasks = proc.tasks.map((l) => l.map((ts) => Object.assign(ts, { leaf: !links.includes(ts.id) })))
  }, [])

  const insertAfter: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      const proc = procs.find((p) => p.tasks.flat().includes(ts))
      if (!proc) return
      const currLayer = proc.tasks.findIndex((l) => l.includes(ts))

      if (!proc.links[currLayer]) {
        proc.links[currLayer] = []
      }

      const childTask: TaskSchema = {
        id: v4(),
        name: `task${currLayer + 1}_${proc.links[currLayer].filter((l) => l.src === ts.id).length}`,
        actions: [],
        validated: false,
        map: {},
        createdAt: Date.now()
      }

      if (!proc.tasks[currLayer + 1]) {
        proc.tasks[currLayer + 1] = [childTask]
      } else {
        proc.tasks[currLayer + 1].push(childTask)
      }

      const newLink: Link = { src: ts.id, dest: childTask.id }

      if (!proc.links[currLayer]) {
        proc.links[currLayer] = [newLink]
      } else {
        proc.links[currLayer].push(newLink)
      }

      sort(proc)

      setState({ cache: { ...cache } })
    },
    [cache, procs]
  )

  const insertBefore: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      const proc = procs.find((p) => p.tasks.flat().includes(ts))
      if (!proc) return

      /**
       * process
       * 1. compute lower links on the task schema(you don't need upper links)
       * 2. move lower links 1 index backwards
       * 3. replace the empty spot with new link that connect new task and the current task
       * => you can accomplish it with splice function
       * 4. compute task layers based on new link layers
       */

      const currLayerIndex = proc.tasks.findIndex((l) => l.includes(ts))

      const newParent: TaskSchema = {
        id: v4(),
        name: `task${currLayerIndex}_0`,
        actions: [],
        validated: false,
        map: {},
        createdAt: Date.now()
      }

      const originalLink = proc.links[currLayerIndex - 1]?.find((l) => l.dest === ts.id)

      console.log('original link: ', JSON.stringify(originalLink))

      const lowerLinks = originalLink ? _getLowerLinkSequence(originalLink) : proc.links.flat()

      if (originalLink) {
        originalLink.dest = newParent.id
      }

      console.log('lower links: ', JSON.stringify(lowerLinks))

      const snapshot = proc.links.map((layer) => layer.slice())

      console.log('before: ', JSON.stringify(proc.links))

      proc.links.forEach(function (layer, i) {
        const linksToMove = snapshot[i].filter((l) => lowerLinks.includes(l))

        if (linksToMove.length && !proc.links[i + 1]) {
          proc.links[i + 1] = linksToMove.slice()
        }
        proc.links[i] = snapshot[i].filter((l) => !lowerLinks.includes(l))
      })

      console.log('after0: ', JSON.stringify(proc.links))

      const newLink: Link = {
        src: newParent.id,
        dest: ts.id
      }

      if (!proc.links[currLayerIndex]) {
        proc.links[currLayerIndex] = []
      }
      proc.links[currLayerIndex].push(newLink)

      console.log('after1: ', JSON.stringify(proc.links))

      // console.log('linkSequence: ', linkSequence)

      // const linkLayersToMoveBackwards = proc.links
      //   .map((ll) => ll.filter((l) => linkSequence.includes(l)))
      //   .toSpliced(originalLink ? currLayerIndex - 1 : 0, 0, [newLink])

      // console.log('linkLayersToMoveBackwards: ', linkLayersToMoveBackwards)

      // const restLinkLayers = proc.links.map((ll) => ll.filter((l) => !linkSequence.includes(l)))

      // console.log('restLinkLayers: ', restLinkLayers)

      // proc.links = restLinkLayers.concat(linkLayersToMoveBackwards)

      const tasks = proc.tasks.flat().concat([newParent])

      proc.tasks = [ts === proc.tasks[0][0] ? [newParent] : proc.tasks[0]].concat(
        proc.links.map((ll) =>
          ll.map(function (l) {
            const t = tasks.find((t) => t.id === l.dest)
            if (!t) throw new Error('NO_TASK_RESOLVED')
            return t
          })
        )
      )

      // if (ts === proc.tasks[0][0]) {
      //   proc.tasks = proc.tasks.toSpliced(currLayer, 0, [newParent])
      //   proc.links = proc.links.toSpliced(currLayer, 0, [{ src: newParent.id, dest: ts.id }])
      // } else {
      //   const originalUpperLink = proc.links[currLayer - 1].find((l) => l.dest === ts.id)
      //   const originalParentId = proc.links[currLayer - 1].find((l) => l.dest === ts.id)?.src

      //   if (!originalParentId) throw new Error('INSERT_BEFORE:NO_PARENT')

      //   const linksToMoveBackward = proc.links[currLayer - 1].filter((l) => l.src === originalParentId)

      //   const newLinksToReplace: Array<Link> = linksToMoveBackward.map((l) => ({ ...l, src: newParent.id }))

      //   const newUpperLinkLayer = proc.links[currLayer - 1]
      //     .filter((l) => !linksToMoveBackward.includes(l))
      //     .concat(newLinksToReplace)

      //   const newLowerLinkLayer = proc.links[currLayer].concat(linksToMoveBackward)

      //   proc.links = proc.links.with(currLayer - 1, newUpperLinkLayer).with(currLayer, newLowerLinkLayer)

      //   const tasksToMoveBackwards = proc.tasks[currLayer].filter((t) =>
      //     linksToMoveBackward.some((l) => l.dest === t.id)
      //   )

      //   const newUpperTaskLayer = proc.tasks[currLayer]
      //     .filter((t) => linksToMoveBackward.every((l) => l.dest !== t.id))
      //     .concat([newParent])

      //   const newLowerTaskLayer = (proc.tasks[currLayer + 1] || []).concat(tasksToMoveBackwards)

      //   proc.tasks = proc.tasks.with(currLayer, newUpperTaskLayer).with(currLayer + 1, newLowerTaskLayer)
      // }

      console.log('proc after insertion: ', proc)

      sort(proc)

      setState({ cache: { ...cache } })
    },
    [cache, procs]
  )

  const _getUpperLinkSequence = useCallback(
    function (link: Link): Array<Link> {
      const proc = procs.find((p) => p.tasks.flat().includes(ts))

      if (!proc) throw new Error('NO_PROC')

      const links = proc.links.flat()

      const parent = links.find((l) => l.dest === link.src)

      if (!parent) return []

      return _getUpperLinkSequence(parent).concat([parent])
    },
    [procs]
  )

  const _getLowerLinkSequence = useCallback(
    function (link: Link): Array<Link> {
      const proc = procs.find((p) => p.tasks.flat().includes(ts))

      if (!proc) throw new Error('NO_PROC')
      const linkSequences = proc.links.flat()

      const children = linkSequences.filter((l) => l.src === link.dest)

      if (!children.length) return []

      return children.concat(children.flatMap((c) => _getLowerLinkSequence(c)))
    },
    [procs]
  )

  const remove: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      if (!ts.leaf) return
      const proc = procs.find((p) => p.tasks.flat().includes(ts))
      if (!proc) return
      const currLayer = proc.tasks.findIndex((l) => l.includes(ts))
      if (currLayer === -1) return
      proc.tasks[currLayer] = proc.tasks[currLayer].filter((_ts) => _ts !== ts)
      if (currLayer !== 0) proc.links[currLayer - 1] = proc.links[currLayer - 1].filter((link) => link.dest !== ts.id)

      sort(proc)

      setState({ cache: { ...cache } })
    },
    [cache, procs]
  )

  const setTaskName: React.FocusEventHandler<HTMLDivElement> = useCallback(function (e) {
    ts.name = e.currentTarget.textContent || 'Task'
    setState({ cache: { ...cache } })
  }, [])

  const handleNameChange: React.KeyboardEventHandler<HTMLDivElement> = useCallback(function (e) {
    const length = e.currentTarget.textContent?.length || 0
    if (length > 21) {
      e.currentTarget.textContent = e.currentTarget.textContent!.slice(0, 20)
      pushMessage({
        message: '이름은 20자를 넘길 수 없습니다',
        autoRemove: true,
        layer: safeGetBody().querySelector('#push')
      })
      e.currentTarget.blur()
    }
    if (e.key === 'Enter') e.currentTarget.blur()
  }, [])

  const setEditable: React.MouseEventHandler<HTMLDivElement> = useCallback(function (e) {
    ;(e.target as HTMLDivElement).setAttribute('contenteditable', 'true')
    ;(e.target as HTMLDivElement).focus()
  }, [])

  const headerRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()

  const toBuilder: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      navigate(`/builder/${ts.id}`)
    },
    [ts]
  )

  const toggleSharing: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      ts.sharing = !ts.sharing
      setState({ cache: { ...cache } })
    },
    [ts]
  )

  const defineRoutes = useCallback(
    function () {
      const proc = procs.find((p) => p.tasks.flat().includes(ts))
      if (!proc)
        return pushMessage({
          message: 'PREDICATION_INPUT:ON_RESOLVE:NO_PROC_MATCHED',
          layer: safeGetBody().querySelector('#push'),
          autoRemove: false
        })

      const currLayerIndex = proc.tasks.findIndex((l) => l.includes(ts))
      if (currLayerIndex === -1)
        return pushMessage({
          message: 'DECIDE_NEXT_TASK:NO_LINK_LAYER_FOUND',
          layer: safeGetBody().querySelector('#push'),
          autoRemove: false
        })

      const nextTaskLayer = proc.tasks[currLayerIndex + 1] || []

      const links = proc.links[currLayerIndex].filter((l) => l.src === ts.id)

      setOverlay(
        <Form
          header='다음 태스크(Task)로 가는 경로(Route)와 판별식(Predication)을 설정할 수 있습니다'
          record={Object.fromEntries(
            nextTaskLayer.map(function (nextTs) {
              return [
                nextTs.name,
                {
                  data: links.some((l) => l.dest === nextTs.id) ? '1' : '',
                  labeler(value) {
                    return value ? '활성화 됨' : '비활성화 됨'
                  },
                  modal(getter, setter, close) {
                    return (
                      <Form
                        header=''
                        record={{
                          '활성화 여부': {
                            data: getter(),
                            labeler(value) {
                              return value ? '비활성화 하기' : '활성화 하기'
                            },
                            effect(getter, setter) {
                              setter(getter() ? '' : '1')
                            }
                          },
                          판별식: {
                            data: links.find((l) => l.src === ts.id && l.dest === nextTs.id)?.predication,
                            labeler(value) {
                              return value ? '수정하기' : '입력하기'
                            },
                            modal(getter, setter, close) {
                              return (
                                <FunctionCreator
                                  initial={getter()}
                                  placeholder='판별식을 입력하세요'
                                  name='predicate'
                                  returnType={{ label: 'Array<Array<string>>', scheme: z.array(z.array(z.string())) }}
                                  parameters={[
                                    {
                                      id: 'dr',
                                      type: 'DataRecord',
                                      snapshot: getUpperSnapshots(ps, nextTs).reduce(function (prev, curr) {
                                        return Object.assign(prev, curr)
                                      }, {})
                                    }
                                  ]}
                                  onResolve={function (sanitized) {
                                    setter(sanitized)
                                    close()
                                  }}
                                  onReject={function () {
                                    setter(getter() || '')
                                    close()
                                  }}
                                />
                              )
                            }
                          }
                        }}
                        onResolve={function (formData) {
                          setter(formData['활성화 여부'] || '')

                          const link = links.find((l) => l.src === ts.id && l.dest === nextTs.id)

                          if (!link) {
                            proc.links[currLayerIndex].push({
                              src: ts.id,
                              dest: nextTs.id,
                              predication: formData['판별식']
                            })
                            return close()
                          }

                          link.predication = formData['판별식']

                          close()
                        }}
                        onReject={close}
                      />
                    )
                  }
                } as ComponentProps<typeof Form>['record'][string]
              ]
            })
          )}
          onResolve={function (formData) {
            nextTaskLayer.forEach(function (nextTs) {
              const active = formData[nextTs.name]

              const linkIndex = proc.links[currLayerIndex].findIndex((l) => l.src === ts.id && l.dest === nextTs.id)

              if (linkIndex === -1) throw new Error(`NO_LINK_FROM_${ts.name}_TO_${nextTs.name}`)

              if (!active) proc.links[currLayerIndex].splice(1, linkIndex)

              sort(proc)
              setState({ cache: { ...cache } })
              setOverlay(null)
            })
          }}
          onReject={function () {
            setOverlay(null)
          }}
          // record={{
          //   '다음 태스크': {
          //     data: link?.dest,
          //     modal(getter, setter, close) {
          //       return (
          //         <Select
          //           header='다음 태스크를 선택하세요'
          //           singular
          //           required
          //           options={(proc.tasks[currLayer + 1] || []).map((ts) => [ts.id])}
          //           labels={(proc.tasks[currLayer + 1] || []).map((ts) => [ts.name])}
          //           onReject={function () {
          //             close()
          //           }}
          //           onResolve={function (chosens, indexes) {
          //             setter(chosens[0][0])

          //             return close()
          //           }}
          //         />
          //       )
          //     }
          //   },
          //   판별식: {
          //     data: ts.predication,
          //     modal(getter, setter, close) {
          //       return (
          //         <PredicationLayout>
          //           <FunctionCreator
          //             name='route'
          //             async
          //             initial={getter()}
          //             placeholder='다음 태스크를 판별하기 위한 스크립트를 작성하세요'
          //             parameters={[
          //               {
          //                 id: 'dr',
          //                 type: 'Record<string, Array<Array<string>>',
          //                 snapshot: getUpperSnapshots(ps, ts).reduce(function (prev, curr) {
          //                   return Object.assign(prev, curr)
          //                 }, {})
          //               }
          //             ]}
          //             returnType={{ label: 'boolean', scheme: z.boolean() }}
          //             onResolve={function (sanitized, snapshotValue, async) {
          //               setter(sanitized)
          //               close()
          //             }}
          //             onReject={function (reason) {
          //               close()
          //             }}
          //             onPreflight={async function (sanitized, params) {
          //               if (!sanitized) return true
          //               const evHandler = getEvHandler()
          //               const validated = await evHandler.sendEvent<Pipe<PredicateRoute>>({
          //                 name: 'PIPE',
          //                 payload: {
          //                   name: 'PREDICATE_ROUTE',
          //                   payload: {
          //                     script: sanitized,
          //                     params: params.map((param) => ({ id: param.id, value: param.snapshot }))
          //                   },
          //                   meta: { receiver: { component: 'RENDERER', alias: 'USER' } }
          //                 },
          //                 meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
          //               })

          //               console.log(validated)

          //               return validated
          //             }}
          //           />
          //         </PredicationLayout>
          //       )
          //     }
          //   }
          // }}
          // onReject={function () {
          //   setOverlay(null)
          // }}
          // onResolve={function (formData) {
          //   if (link) {
          //     link.dest = formData['다음 태스크']
          //     link.predication = formData['판별식']
          //   } else {
          //     proc.links[currLayer].push({ src: ts.id, dest: formData['다음 태스크'], predication: formData['판별식'] })
          //   }
          //   ts.predication = formData.Predication || ''
          //   // link.predication = sanitized

          //   setOverlay(null)
          //   setState({ procedureSchemas: procs.slice() })
          // }}
        />
      )
    },
    [procs]
  )

  const ps = useRef<ProcedureSchema>(procs.find((p) => p.tasks.flat().includes(ts))!).current

  useEffect(function autoFocus() {
    if (!headerRef.current?.textContent) headerRef.current?.click()
  }, [])

  useEffect(function log() {
    if (process.env.NODE_ENV !== 'devserver') return
    console.log(
      `task : ${JSON.stringify(ps?.tasks.map((layer) => layer.map((t) => ({ id: t.id, name: t.name, leaf: t.leaf }))))}`
    )
    const tasks = ps?.tasks.flat()
    console.log(
      `link : ${JSON.stringify(
        ps?.links.map((layer) =>
          layer.map((l) => ({
            src: tasks?.find((t) => t.id === l.src)?.name,
            dest: tasks?.find((t) => t.id === l.dest)?.name
          }))
        )
      )}`
    )
  }, [])

  return (
    <Container>
      {/* {!prev && (
        <>
          <Add onClick={insertBefore} />
          <FlowArrow />
        </>
      )} */}
      <UtilityContainer>
        <SmallRoundButton onClick={insertAfter}>
          <GreaterThan />
        </SmallRoundButton>
        {ts !== ps.tasks[0][0] && (
          <SmallRoundButton onClick={insertBefore}>
            <LessThan />
          </SmallRoundButton>
        )}
        {ts.leaf && (
          <SmallRoundButton onClick={remove}>
            <Minus />
          </SmallRoundButton>
        )}
      </UtilityContainer>
      <TaskContainer>
        <Header
          ref={headerRef}
          suppressContentEditableWarning
          spellCheck={false}
          // placeholder='태스크의 이름을 입력하세요'
          autoCorrect='false'
          onKeyDown={handleNameChange}
          onBlur={setTaskName}
          onClick={setEditable}
        >
          {ts.name}
        </Header>
        <Content>
          <UtilityButton data-desc2='태스크(Task)를 정의합니다' onClick={toBuilder}>
            <Write />
          </UtilityButton>

          <UtilityButton
            data-desc2='다음 태스크(Task)로 가는 경로(Route)와 판별식(Predication)을 설정합니다'
            onClick={defineRoutes}
            // disabled={
            //   ps.tasks.findIndex((layer) => layer.includes(ts)) === 0 ||
            //   ps.tasks.findIndex((layer) => layer.includes(ts)) === ps.tasks.length - 1
            // }
          >
            <Route />
          </UtilityButton>

          <UtilityButton
            reverse={ts.sharing}
            data-desc2={ts.sharing ? '공유 태스크로 설정되어 있습니다' : '공유 태스크로 설정되어 있지않습니다'}
            onClick={toggleSharing}
          >
            <Network2 />
          </UtilityButton>
        </Content>
      </TaskContainer>
      {/* <FlowArrow />
      {!next && <Add onClick={insertAfter} />} */}
    </Container>
  )
}

export default Task
