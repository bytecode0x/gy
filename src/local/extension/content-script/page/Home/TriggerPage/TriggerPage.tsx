import { FlexColumnDiv, FlexDiv, TextButton } from 'lib/frame/generic'
import { ElevatedButton, TextButtonsLayout1 } from 'lib/frame/sementic'
import { ProcedureDescriptor } from 'lib/gy/core/type/procedure'
import { Trigger } from 'lib/gy/core/type/trigger'
import { pushMessage } from 'lib/util/dom/render'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import TriggerDesigner from 'local/extension/content-script/components/TriggerDesigner'
import TriggerSelector from 'local/extension/content-script/components/TriggerSelector'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { CancelTrigger, SetTrigger } from 'sementic_events'
import styled from 'styled-components'
import { v4 } from 'uuid'

const Container = styled(FlexColumnDiv)`
  position: relative;
  align-items: stretch;

  padding: 12px;
  min-width: 200px;
  // min-height: 200px;
  background-color: white;
  box-shadow: var(--shadow-elevation4);
  border-radius: 4px;

  & > *:not(:first-child) {
    margin-top: 6px;
  }
`

const TriggerSequenceContainer = styled(FlexColumnDiv)`
  // align-items: start;
`

const TriggerSequence = styled(FlexDiv)`
  font-size: 12px;

  & > span {
    box-shadow: var(--shadow-elevation);
    padding: 6px;
    margin: 4px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  & > span[data-select='true'] {
    background-color: rgba(0, 0, 0, 0.2);
  }
`

type TriggerProps = {
  pd: ProcedureDescriptor<TriggerPreset>
  onClose: () => any
}

const TriggerPage: FC<TriggerProps> = ({ pd, onClose }) => {
  // const [selectorToggle, setSelectorToggle] = useState<boolean>(false)
  const [currentTrigger, setCurrentTrigger] = useState<Trigger<TriggerPreset> | null>(null)
  const [triggers, setTriggers] = useState(pd.triggers)
  const [partial, setPartial] = useState<{
    name?: string
    id?: string
    pid: string
    template: Trigger<TriggerPreset>['template']
    value?: Trigger<TriggerPreset>['value']
    on?: boolean
  } | null>(null)

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

  const selectTrigger = useCallback(
    function () {
      const revert = setOverlay(
        <TriggerSelector
          onSelect={function (template) {
            setPartial({ template, id: v4(), pid: pd.pid, name: '', on: true })
            revert()
          }}
        />
      )
    },
    [pd]
  )

  const defineTrigger = useCallback(
    function ({
      partial
    }: {
      partial: {
        name?: string
        id?: string
        pid: string
        template: Trigger<TriggerPreset>['template']
        value?: Trigger<TriggerPreset>['value']
        on?: boolean
      }
    }) {
      const revert = setOverlay(
        <TriggerDesigner
          initial={partial}
          onResolve={async function (t) {
            const { gy, setState } = getStore().getState()

            console.log('check5: ', t)

            if (process.env.NODE_ENV !== 'devserver') {
              const evHandler = getEvHandler()
              console.log('check6')

              await evHandler.sendEvent<SetTrigger>({
                name: 'SET_TRIGGER',
                payload: { trigger: t },
                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
              })

              console.log('check7')
            }

            console.log('check3')

            if (pd.triggers.flat().findIndex((trigger) => trigger.id === t.id) === -1)
              pd.triggers[0] = pd.triggers[0] ? pd.triggers[0].concat([t]) : [t]

            setTriggers(pd.triggers.slice())
            setPartial(null)
            revert()

            console.log('check4')
            setState({ gy: { ...gy } })
          }}
          onReject={function () {
            revert()
          }}
        />
      )
    },
    [pd]
  )

  const removeTrigger = useCallback(
    async function () {
      if (!currentTrigger) return
      const row = pd.triggers.find((sequence) => sequence.includes(currentTrigger))
      if (!row) return
      const colIndex = row.findIndex((t) => t === currentTrigger)
      row.splice(colIndex, 1)

      if (process.env.NODE_ENV !== 'devserver') {
        const evHandler = getEvHandler()

        await evHandler.sendEvent<CancelTrigger>({
          name: 'CANCEL_TRIGGER',
          payload: { trigger: currentTrigger },
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })
      }

      setTriggers(pd.triggers.slice())
    },
    [pd, currentTrigger]
  )

  // const ol = useRef<HTMLDivElement>(safeGetBody().querySelector('#ol'))

  useEffect(
    function () {
      if (!partial) return
      defineTrigger({ partial })
    },
    [partial, pd]
  )

  return (
    <Container>
      <TextButtonsLayout1>
        <TextButton onClick={onClose}>확인</TextButton>

        <TextButton
          data-desc2='트리거 추가하기'
          // disabled={!action}
          onClick={selectTrigger}
        >
          추가
        </TextButton>

        <TextButton data-desc2='트리거 삭제하기' disabled={!currentTrigger} onClick={removeTrigger}>
          삭제
        </TextButton>
      </TextButtonsLayout1>
      <TriggerSequenceContainer>
        {triggers.map((sequence, index) => (
          <TriggerSequence key={index}>
            {sequence.map((trigger) => (
              <ElevatedButton
                key={trigger.id}
                onClick={function () {
                  setCurrentTrigger(currentTrigger === trigger ? null : trigger)
                }}
                onDoubleClick={function () {
                  defineTrigger({ partial: trigger })
                }}
                selected={currentTrigger === trigger}
              >
                {trigger.name}
              </ElevatedButton>
            ))}
          </TriggerSequence>
        ))}
      </TriggerSequenceContainer>
    </Container>
  )
}
export default TriggerPage
