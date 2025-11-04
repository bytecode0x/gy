import Plus from 'lib/asset/svg/Plus'
import { FlexDiv, SVGButton } from 'lib/frame/generic'
import Script from 'local/extension/content-script/components/Script'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore } from 'local/extension/content-script/store'
import { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CreateScript } from 'sementic_events'
import styled from 'styled-components'
import shallow from 'zustand/shallow'

const Container = styled(FlexDiv)`
  flex-wrap: wrap;
  gap: 15px 15px;
  // align-items: stretch;
  // flex: 1;
  padding: 12px;
`

const ScriptPage = () => {
  const [gy, cache, setState] = getStore()(
    useCallback((state) => [state.gy, state.cache, state.setState], []),
    shallow
  )
  const createScript = useCallback(
    async function () {
      const evHandler = getEvHandler()
      const { descriptor, script } = await evHandler.sendEvent<CreateScript>({
        name: 'CREATE_SCRIPT',
        payload: { name: `Script_${gy.$scripts.length}`, code: '' },
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })

      setState({
        gy: {
          ...gy,
          $scripts: gy.$scripts.concat(descriptor)
        },
        cache: { ...cache, scripts: cache.scripts.concat(script) }
      })
    },
    [gy.$scripts, cache]
  )

  return (
    <Container>
      {createPortal(
        <SVGButton data-desc2='추가하기' onClick={createScript}>
          <Plus />
        </SVGButton>,
        safeGetBody().querySelector('#gu')!
      )}
      {gy.$scripts.map((sr) => (
        <Script sr={sr} key={sr.sid} />
      ))}
    </Container>
  )
}

export default ScriptPage
