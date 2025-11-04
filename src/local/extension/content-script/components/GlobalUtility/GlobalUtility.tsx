import ArrowLeft from 'lib/asset/svg/ArrowLeft'
import ArrowRight2 from 'lib/asset/svg/ArrowRight2'
import DarkMode from 'lib/asset/svg/DarkMode'
import LightMode from 'lib/asset/svg/LightMode'
import { FlexCenterDiv, SVGButton } from 'lib/frame/generic'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore } from 'local/extension/content-script/store'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import shallow from 'zustand/shallow'

const Container = styled(FlexCenterDiv)`
  & > button {
    border-radius: 4px;
    background-color: white;
    padding: 4px;
    box-shadow: var(--shadow-elevation);
  }

  & > button:not(:first-of-type) {
    margin-left: 4px;
  }

  & svg {
    width: 12px;
    height: 12px;
  }
`

const GlobalUtility = () => {
  const [config, setState] = getStore()(
    useCallback((state) => [state.config, state.setState], []),
    shallow
  )
  const history = useNavigate()

  const backwards = useCallback(function () {
    history(-1)
  }, [])
  const forwards = useCallback(function () {
    history(1)
  }, [])

  const toggleTheme = useCallback(
    function () {
      const theme = config.theme === 'light' ? 'dark' : 'light'
      const frame = safeGetBody().querySelector('[id="gatsby-frame"]')
      if (!frame) throw new Error('TOGGLE_THEME:NO_FRAME_FOUND')
      /**
       * instead of re-rendering whole app according to theme value
       * I would be better just set manually here to invoke css evaluation
       */
      frame.setAttribute('data-theme', theme)
      setState({ config: { ...config, theme } })
    },
    [config]
  )

  return (
    <Container id='gu'>
      <SVGButton data-desc='뒤로' onClick={backwards}>
        <ArrowLeft />
      </SVGButton>
      <SVGButton data-desc='앞으로' onClick={forwards}>
        <ArrowRight2 />
      </SVGButton>
      <SVGButton data-desc='테마 토글' onClick={toggleTheme}>
        {config.theme === 'light' ? <LightMode /> : <DarkMode />}{' '}
      </SVGButton>
    </Container>
  )
}

export default GlobalUtility
