import HorizontalThreeDots from 'lib/asset/svg/HorizontalThreeDots'
import {
    CopyScript,
    GetScript,
    InvokeEffect,
    MergeTrees,
    Pipe,
    QueryTreeAll,
    RemoveScripts,
    RemoveTrees,
    SetTreeDescriptorName,
    UpdateScript,
    UpdateScriptDescriptor
} from 'lib/event/sementic'
import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Span, SVGButton, TextButton } from 'lib/frame/generic'
import { DataNode } from 'lib/gy/core/class/data-node'
import { ScriptDescriptor } from 'lib/gy/core/type/script'
import { overlayLoader, pushMessage } from 'lib/util/dom/render'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import { FC, useCallback, useRef, useState } from 'react'
import styled from 'styled-components'
import { z } from 'zod'
import FunctionCreator from '../FunctionCreator'
import TreeManager from '../TreeManager'

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

const LoaderLayout = styled(FlexCenterDiv)`
  background-color: transparent;
`

type ScriptProps = {
  sr: ScriptDescriptor
}

const Script: FC<ScriptProps> = ({ sr }) => {
  const [dropDownLayout, setDropDownLayout] = useState<boolean>(false)

  const defineScript = useCallback(
    async function () {
      const container = safeGetBody().querySelector(`[id="${sr.sid}"]`) as HTMLDivElement
      if (!container) return

      const revert = overlayLoader(container)

      const { cache } = getStore().getState()

      const evHandler = getEvHandler()

      const script =
        cache.scripts.find((script) => script.id === sr.sid) ||
        (await evHandler.sendEvent<GetScript>({
          name: 'GET_SCRIPT',
          payload: { sid: sr.sid },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        }))

      revert()

      setOverlay(
        <FunctionCreator
          name={sr.name}
          async
          global={[{ id: 'id', snapshot: sr.sid, type: 'string' }]}
          // later
          parameters={[
            { id: 'tree', snapshot: {}, type: 'DataTree' },
            { id: 'prevScriptResult', snapshot: undefined, type: 'any' }
          ]}
          onResolve={async function (raw) {
            script.code = raw

            const evHandler = getEvHandler()

            await evHandler.sendEvent<UpdateScript>({
              name: 'UPDATE_SCRIPT',
              payload: {
                partial: { id: sr.sid, code: script.code, optional: script.optional, required: script.required }
              },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })

            setOverlay(null)
          }}
          onReject={function () {
            setOverlay(null)
          }}
          returnType={{ scheme: z.any(), label: 'any' }}
          initial={script.code}
        />
      )
    },
    [sr]
  )

  const removeScript: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    async function (e) {
      if (!window.confirm('정말 삭제하시겠습니까?')) return
      const { gy, setState } = getStore().getState()

      const evHandler = getEvHandler()

      await evHandler.sendEvent<RemoveScripts>({
        name: 'REMOVE_SCRIPTS',
        payload: [sr.sid],
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })

      setState({
        gy: {
          ...gy,
          $scripts: gy.$scripts.filter((_) => _.sid !== sr.sid),
          $procedures: gy.$procedures.map((pr) =>
            pr.effect.__i__scripts.flat().includes(sr.sid)
              ? {
                  ...pr,
                  effect: {
                    __i__scripts: pr.effect.__i__scripts.map((sequence) => sequence.filter((sid) => sid !== sr.sid)),
                    config: { disabled: pr.effect.config.disabled.filter((sid) => sid !== sr.sid) }
                  }
                }
              : pr
          )
        }
      })
    },
    [sr]
  )

  const copyScript = useCallback(
    function () {
      const evHandler = getEvHandler()
      evHandler
        .sendEvent<CopyScript>({
          name: 'COPY_SCRIPT',
          payload: { sid: sr.sid },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })
        .then(function ({ descriptor, script }) {
          const { gy, cache, setState } = getStore().getState()

          gy.$scripts.splice(gy.$scripts.findIndex((_) => _.sid === sr.sid) + 1, 0, descriptor)
          cache.scripts.push(script)

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
    [sr]
  )

  const executeScript = useCallback(
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
          onResolve={function (chosens) {
            /**
             * should It execute in parallel or linear
             */

            evHandler.sendEvent<InvokeEffect>({
              name: 'INVOKE_EFFECT',
              payload: {
                effect: { __i__scripts: [[sr.sid]], config: { disabled: [] } },
                treePaths: Array.from(chosens),
                // treeOrTids: Array.from(chosens),
                $cdr: {},
                idr: {}
              },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })

            setOverlay(null)
          }}
        />
      )
    },
    [sr]
  )

  const setEditable: React.MouseEventHandler<HTMLDivElement> = useCallback(function (e) {
    ;(e.target as HTMLDivElement).setAttribute('contenteditable', 'true')
    ;(e.target as HTMLDivElement).focus()
  }, [])

  const setProcName: React.FocusEventHandler<HTMLDivElement> = useCallback(
    function (e) {
      const { gy, cache, setState } = getStore().getState()

      e.target.setAttribute('contenteditable', 'false')

      sr.name = e.currentTarget.textContent || `Script_${gy.$scripts.length}`

      const scriptInCache = cache.scripts.find((s) => s.id === sr.sid)

      if (scriptInCache) scriptInCache.name = sr.name

      const eh = getEvHandler()

      eh.sendEvent<UpdateScriptDescriptor>({
        name: 'UPDATE_SCRIPT_DESCRIPTOR',
        payload: { partial: sr },
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })

      setState({ gy: { ...gy } })
    },
    [sr]
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
  return (
    <Container id={sr.sid} ref={containerRef} active={!!dropDownLayout}>
      <Name
        title={sr.name}
        ref={nameRef}
        suppressContentEditableWarning
        // placeholder='프로시져 이름을 입력하세요'
        onClick={setEditable}
        onBlur={setProcName}
        onKeyDown={handleNameChange}
        autoCorrect='false'
      >
        {sr.name}
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
          <MenuOption data-desc2='스크립트(Script)를 정의합니다' onClick={defineScript}>
            <Span>Define Script</Span>
          </MenuOption>

          <MenuOption data-desc2='스크립트(Script)를 실행합니다' onClick={executeScript}>
            <Span>Execute Script</Span>
          </MenuOption>

          <MenuOption data-desc2='스크립트(Script)를 복사합니다' onClick={copyScript}>
            <Span>Copy</Span>
          </MenuOption>

          <MenuOption data-desc2='스크립트(Script)를 삭제합니다' onClick={removeScript}>
            <Span>Remove</Span>
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

export default Script
