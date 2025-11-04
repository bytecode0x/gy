import HorizontalThreeDots from 'lib/asset/svg/HorizontalThreeDots'
import Form from 'lib/component/Form'
import RawStringInput from 'lib/component/RawStringInput'
import { FlexColumnDiv, FlexDiv, Input, Label, SVGButton } from 'lib/frame/generic'
import { DataNode } from 'lib/gy/core/class/data-node'
import { matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { DataRecord } from 'lib/gy/core/type/primitive'
import { pushMessage } from 'lib/util/dom/render'
import TreeManager from 'local/extension/content-script/components/TreeManager'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import { ComponentProps, useCallback } from 'react'
import {
  InterpretObj,
  MergeTrees,
  OpenDialog,
  Pipe,
  QueryTreeAll,
  RemoveTrees,
  SetGyState,
  SetTreeDescriptorName
} from 'sementic_events'
import styled from 'styled-components'
import shallow from 'zustand/shallow'

const Container = styled(FlexDiv)`
  flex: 1;
  padding: 12px;

  & > div {
    flex: 1;
  }

  & > div:not(:nth-of-type(1)) {
    margin-left: 8px;
  }
`

const ColumnLayout = styled(FlexColumnDiv)`
  & > div {
    background-color: white;
    border-radius: 4px;
    padding: 6px;
    box-shadow: var(--shadow-elevation3);
    flex: 1;
  }

  & > div:not(:nth-of-type(1)) {
    margin-top: 8px;
  }
`

const AppSpecificationContainer = styled(FlexColumnDiv)`
  flex: 1;
`

const AppConfigurationContainer = styled(FlexColumnDiv)`
  flex: 1;
`

const UserProfileContainer = styled(FlexColumnDiv)`
  flex: 1;
`

export const OptionContainer = styled(FlexDiv)`
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: 14px;
`

export const OptionInput = styled(Input)`
  border-bottom: 1px solid black;
  text-align: center;
  width: 100px;

  &[type='number']::-webkit-inner-spin-button {
    // -webkit-appearance: none;
    position: absolute;
    right: 0;
    height: 100%;
    z-index: 1;
  }
`

const ConfigurationPage = () => {
  const [gy, setState] = getStore()(
    useCallback((state) => [state.gy, state.setState], []),
    shallow
  )
  // const [workDir, setWorkDir] = useState<string>()

  const configGdr = useCallback(
    async function () {
      const evHandler = getEvHandler()

      const gdrSnapshot: DataRecord = { ...gy.gdr }

      setOverlay(
        <Form
          header='Global Data Record'
          configurable
          onRecordKeyChange={async function (prev, curr) {
            const evHandler = getEvHandler()

            const gdr = { ...gy.gdr, [curr]: gy.gdr[prev] }

            delete gdr[prev]

            await evHandler.sendEvent<SetGyState>({
              name: 'SET_GY_STATE',
              payload: { gdr },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })

            setState({ gy: { ...gy, gdr } })
          }}
          defaultSchema={function (key) {
            return {
              modifable: true,
              effect(getter, setter) {
                /**
                 * children inside modal already rendered before opening modal
                 * It might be better to render on effect ?
                 */

                const revertOverlay = setOverlay(
                  <RawStringInput
                    header={`GDR ${key}`}
                    initial={{ [key]: gy.$gdr[key] }}
                    onReject={function () {
                      revertOverlay()
                    }}
                    onResolve={function ({ [key]: $entry }, { [key]: entry }) {
                      if (!matrixSchema.safeParse(entry).success)
                        return pushMessage({
                          message: `you must resolve in matrix`,
                          layer: safeGetBody().querySelector('#push')
                        })

                      setter($entry)
                      gdrSnapshot[key] = entry
                      revertOverlay()
                    }}
                    interpret={(raw) =>
                      evHandler.sendEvent<InterpretObj>({
                        name: 'INTERPRET_OBJ',
                        payload: { raw },
                        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                      })
                    }
                  />
                )
              }
            }
          }}
          record={{
            WORK_DIR: {
              data: gy.gdr.WORK_DIR?.at(0)?.at(0),
              help: '기본 저장 경로를 선택하세요',
              effect(getter, setter) {
                return evHandler
                  .sendEvent<OpenDialog>({
                    name: 'OPEN_DIALOG',
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
                    payload: { properties: ['openDirectory', 'createDirectory'], title: '폴더를 선택하세요' }
                  })
                  .then(function ({ canceled, filePaths }) {
                    if (canceled) return
                    setter(filePaths[0])
                  })
              }
            },
            ...Object.fromEntries(
              Object.entries(gy.$gdr).map(([key, raw]) => [
                key,
                {
                  data: raw,
                  modifiable: true
                } as ComponentProps<typeof Form>['record'][string]
              ])
            )
          }}
          onReject={function () {
            setOverlay(null)
          }}
          onResolve={async function (formData) {
            console.log('new gdr: ', gdrSnapshot)

            await evHandler.sendEvent<SetGyState>({
              name: 'SET_GY_STATE',
              payload: { gdr: gdrSnapshot, $gdr: formData },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })

            setState({
              gy: {
                ...gy,
                gdr: gdrSnapshot,
                $gdr: formData
              }
            })

            setOverlay(null)
          }}
        />
      )
    },
    [gy]
  )

  const manageTree = useCallback(async function () {
    const evHandler = getEvHandler()

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
        onResolve={function () {
          setOverlay(null)
        }}
      />
    )
  }, [])

  return (
    <Container>
      <ColumnLayout>
        <AppConfigurationContainer>
          <OptionContainer>
            <Label>SET GDR</Label>
            <SVGButton onClick={configGdr}>
              <HorizontalThreeDots />
            </SVGButton>
          </OptionContainer>
          <OptionContainer>
            <Label>MANAGE TREE</Label>
            <SVGButton onClick={manageTree}>
              <HorizontalThreeDots />
            </SVGButton>
          </OptionContainer>
        </AppConfigurationContainer>
      </ColumnLayout>
      <ColumnLayout>
        <AppSpecificationContainer />
        <UserProfileContainer />
      </ColumnLayout>
    </Container>
  )
}

export default ConfigurationPage
