import ArrowLeft from 'lib/asset/svg/ArrowLeft'
import ArrowRight2 from 'lib/asset/svg/ArrowRight2'
import Square from 'lib/asset/svg/Square'
import { GetState, MaximizeWindow, RendererReady, SetStore } from 'lib/event/sementic'
import { FlexCenterDiv, FlexColumnDiv, FlexDiv, SVGButton } from 'lib/frame/generic/molecule'
import { EllipticalLabel } from 'lib/frame/sementic'
import { useCallback, useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import styled, { createGlobalStyle, keyframes } from 'styled-components'
import { AppStore } from 'type'
import shallow from 'zustand/shallow'
import CloseWindow from './component/CloseWindow'
import Navigation from './component/Navigation'
import { getDocument } from './function/document'
import ConfigPage from './page/ConfigPage'
import RootPage from './page/RootPage'
import { getStore, UserState } from './store'
import './user.css'

const App = () => {
  const [persistent] = getStore()(
    useCallback((state) => [state.persistent], []),
    shallow
  )

  const navigate = useNavigate()

  const maximizeWindow = useCallback(function () {
    window.eh.sendEvent<MaximizeWindow>({
      name: 'MAXIMIZE_WINDOW',
      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
    })
  }, [])

  const backwards = useCallback(function () {
    navigate(-1)
  }, [])
  const forwards = useCallback(function () {
    navigate(1)
  }, [])

  const showDescOnHover = useCallback((e: MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return
    const desc =
      (e.target as HTMLElement).getAttribute('data-desc')?.trim() ||
      (e.target as HTMLElement).getAttribute('data-desc2')?.trim()
    if (!desc) return
    const footer = getDocument().querySelector('#desc') as HTMLDivElement
    if (footer) footer.innerText = desc
    const cleanup = () => {
      footer.innerText = ''
      e.target?.removeEventListener('mouseleave', cleanup)
    }
    e.target.addEventListener('mouseleave', cleanup)
  }, [])

  useEffect(function () {
    window.eh.sendEvent<RendererReady>({
      name: 'RENDERER_READY',
      meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
      payload: window.eh.id as number
    })

    getDocument().addEventListener('mouseover', showDescOnHover)
  }, [])

  useEffect(
    function store() {
      window.eh.sendEvent<SetStore<AppStore>>({
        name: 'SET_STORE',
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
        payload: persistent
      })
    },
    [persistent]
  )

  useEffect(function () {
    window.eh.onEvent<GetState<UserState>>('GET_STATE', function ({ name, payload, meta }) {
      // should It be able to refer to deep-partially ?
      const state = getStore().getState()

      return payload.reduce((a, b) => Object.assign(a, { [b]: state[b] }), {} as UserState)
    })
  }, [])

  return (
    <Container>
      <GlobalStyles />

      <Navigation />

      <ContentLayout>
        <Top>
          <TopLeft>
            <UtilityLayout>
              <SVGButton data-desc='뒤로' onClick={backwards}>
                <ArrowLeft />
              </SVGButton>
              <SVGButton data-desc='앞으로' onClick={forwards}>
                <ArrowRight2 />
              </SVGButton>
            </UtilityLayout>
          </TopLeft>
          <DragHandleArea onDoubleClick={maximizeWindow}>Drag Area</DragHandleArea>
          <TopRight>
            <UtilityLayout>
              <SVGButton data-desc='최대화' onClick={maximizeWindow}>
                <Square />
              </SVGButton>
              <CloseWindow />
            </UtilityLayout>
          </TopRight>
        </Top>
        <Middle>
          <Routes>
            <Route path='/' element={<RootPage />} />
            <Route path='/config' element={<ConfigPage />} />
          </Routes>
        </Middle>
        <Bottom id='footer'>
          <StatusDisplay id='status' />
          <Description id='desc' />
        </Bottom>
      </ContentLayout>
      <PushMessageContainer id='push'>push</PushMessageContainer>
    </Container>
  )
}

const Container = styled(FlexDiv)`
  flex: 1;

  width: 100%;
  height: 100%;
`

const ContentLayout = styled(FlexColumnDiv)`
  flex: 1;

  min-width: 0;
  min-height: 0;
`

const Top = styled(FlexDiv)`
  height: 60px;

  border-bottom: 1px solid var(--color-border-base);
`

const TopLeft = styled(FlexDiv)``

const TopRight = styled(FlexDiv)``

const UtilityLayout = styled(FlexDiv)`
  align-items: flex-start;
  // justify-content: flex-end;

  padding: 6px;

  & > button {
    border-radius: 4px;
    background-color: white;
    padding: 4px;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.6);
  }

  & > button:not(:first-of-type) {
    margin-left: 4px;
  }

  & svg {
    width: 12px;
    height: 12px;
    color: #6b6b6b;
  }
`

const DragHandleArea = styled(FlexCenterDiv)`
  flex: 1;
  -webkit-app-region: drag;
`

const Middle = styled(FlexColumnDiv)`
  flex: 1;
  background-color: var(--color-light-grey2);

  border-bottom: 1px solid var(--color-border-base);

  padding: 4px;

  min-height: 0;
`

const Bottom = styled(FlexDiv)`
  align-items: center;

  height: 30px;
  background-color: var(--color-theme-primary);R
  font-size: 14px;
  padding: 0 0.5em;
`

const Description = styled(EllipticalLabel)`
  &::before {
    content: attr(data-head);
    margin-left: 2px;
    font-size: 10px;
  }

  &::after {
    content: attr(data-tail);
    margin-left: 2px;
    font-size: 10px;
  }
`

const StatusDisplay = styled(FlexDiv)`
  width: 100px;
`

const PushMessageContainer = styled(FlexColumnDiv)`
  justify-content: flex-end;
  position: absolute;
  left: 100%;
  top: 100%;
  // background-color: blue;
  // width: 200px;
  // min-height: 100px;
  transform: translate(-100%, -100%);
  z-index: 1;
  padding: 1rem;
  overflow: hidden;

  & > div {
    margin-top: 1rem;
    height: auto;
    width: 100%;
  }
`

const GlobalStyles: any = createGlobalStyle`
*,
*:after,
*:before {
  box-sizing: border-box;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

#frame {
  width : 100vw;
  height: 100vh;
}

html {
  --text-color-primary: #202123;
  --text-color-default: #353740;
  --text-color-secondary: #6e6e80;
  --text-color-disabled: #acacbe;

  --color-bg-dark1: #23272a;
  --color-bg-dark2: #2c2f33;
  --color-bg-dark3: #18181b;
  --color-bg-dark4: #1f1f23;
  --color-bg-dark5: #a0a0a0;

  --color-bg-dark-offset1: #b0b0b0;

  --color-bg-light1: #ffffff;
  --color-bg-light-offset1: #f1f3f7;
  --color-bg-light2: #efeff1;

  --color-text-light1: #3a3c42;
  --color-text-light-offset1: #898c94;

  --color-chrome : #e8eaf6;

  --color-theme-primary :  #fafafa;

  --color-orange: #ff6347;
  --color-green: #228b22;
  --color-purple: #9665c4;
  --color-red: #d92027;
  --color-black: #000;
  --color-white: #fff;
  --color-light-grey: rgb(230, 230, 230);

  --internal-light-dark: #f00;
  --shadow-menu-light: 0 4px 8px rgba(0, 0, 0, 0.3);
  --color-bg-desc-light: var(--color-black);
  --color-desc-light: var(--color-white);

  --padding-large: 1rem;
  --padding-default: 0.5rem;
  --padding-small: 0.25rem;
  --padding-xsmall: 0.125rem;
  --margin-default: 0.5rem;
  --margin-small: 0.25rem;
  --margin-xsmall: 0.125rem;

  --border-radius-default: 8px;

  --svg-size-default: 20px;
  --svg-size-menu: 20px;
  --svg-size-panel: 16px;
  --svg-size-nav: 16px;
  --svg-size-option: 12px;

  --font-size-default: 1rem;
  --font-size-small: 0.625rem;
  --font-size-menu: 16px;
  --font-size-after: 0.75rem;

  --shadow-dropdown: 0 0px 10px rgb(64 64 64 / 15%);

  --scroll-track-size-default: 6px;
  --scroll-track-size-small: 5px;

  --color-dark5: #888;
  --color-dark6: #555;
  --color-light-grey: #e0e0e0;
  --color-light-grey2: #f0f0f0;

  --size-xlarge: 1.5rem;
  --size-large: 1rem;
  --size-default: 0.5rem;
  --size-small: 0.25rem;
  --size-xsmall: 0.125rem;
} 

body {
  display:flex;
  align-items: center;
  justify-content: center;
  margin : 0;
  overflow : hidden;
}

[data-theme='light'] {
  --color-bg-primary: var(--color-bg-light1);
  --color-bg-primary-offset: var(--color-bg-light-offset1);
  --color-bg-secondary: var(--color-bg-light2);
  --color-bg-secondary-offset: var(--color-bg-light-offset1);
  --color-text-primary: var(--color-text-light1);
  --color-text-primary-offset: var(--color-text-light-offset1);

  --color-menu-bg: var(--color-bg-dark1);
  --color-option-logo: rgba(0, 0, 0, 0.2);

  --color-bg-hover-desc: black;
  --color-text-hover-desc : var(--color-desc-light);

  --shadow-popup: 0px 0px 1px 1px rgb(0 0 0 / 50%);
  --shadow-elevation: 0 1px 2px rgba(0, 0, 0, 0.15);
  --shadow-elevation2: 0 4px 8px rgba(0, 0, 0, 0.2);
  --shadow-elevation3: 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-elevation4: 0px 2px 4px rgba(0, 0, 0, 0.6);
  --color-border-base: rgba(0, 0, 0, 0.1);
  --color-border-cell: rgba(0, 0, 0, 0.3);

  --color-border-focusout: rgb(218, 218, 218);
  --color-border-focusin: rgb(218, 218, 218);

  --color-scroll-thumb: var(--color-dark5);
  --color-scroll-thumb-offset: var(--color-dark6);
  --color-placeholder: rgba(0, 0, 0, 0.3);

  --color-table-row: #f7f7f7;
  --color-table-head: ##d7dade;
}

[data-theme='dark'] {
  --color-bg-primary: var(--color-bg-dark3);
  --color-bg-primary-offset: var(--color-bg-dark-offset1);
  --color-bg-secondary: var(--color-bg-dark2);
  --color-bg-secondary-offset: var(--color-bg-dark-offset1);
  --color-text-primary: #fff;
  --color-text-primary-offset: var(--color-bg-light-offset1);

  --color-menu-bg: var(--color-bg-dark1);
  --color-option-logo: rgba(255, 255, 255, 0.2);

  --color-bg-hover-desc: white;
  --color-text-hover-desc : black;

  --shadow-popup: 0px 0px 1px 1px rgb(255 255 255 / 50%);
  --shadow-elevation: 0 1px 2px rgba(0, 0, 0, 0.9);
  --shadow-elevation-2: 0 4px 8px rgba(0, 0, 0, 0.4);
  --color-border-base: hsla(0, 0%, 100%, 0.1);
  --color-border-cell: rgba(255, 255, 255, 0.3);

  --shadow-elevation: 0 1px 2px rgba(0, 0, 0, 0.9), 0 0px 2px rgba(0, 0, 0, 0.9);
  --color-scroll-thumb: var(--color-dark5);
  --color-scroll-thumb-offset: var(--color-dark6);

  --color-table-row: #1f3341;
  --color-table-head: #2b4252;
}

[contenteditable] {
  outline: 0px solid transparent;
  white-space: nowrap;

  &:empty::before {
    content: attr(placeholder);
    color: grey;
  }
}

.push-container {
  display: flex;
  position: relative;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  font-size: 12px;
  flex: 1;
  width: 200px;
  min-height: 30px;
  border-radius: 8px;
  background-color: green;
  box-shadow: var(--shadow-elevation);
  background-color: var(--color-light-grey2);
  margin: 8px;
}

.push-container[fading="true"] {
  &:not(&:hover) {
    animation: ${keyframes`
      0% {
        opacity : 1;
      }
    
      10% {
        opacity : 1;
      }
    
      100% {
        opacity : 0;
      }
    `} 4s 0.4s linear;
  }
}

.push-chrome {
  display : flex;
  position: absolute;
  background-color: transparent;
  bottom: calc(100% - 5px);
  z-index: 1;

  & > div {
    display : flex;
    background: linear-gradient(to bottom, transparent 60%, white 60%);
    border-radius: 50%;
    position: relative;
  }

  & > div + div {
    margin-left : 2px;
  }

  & > div[data-desc-top]:hover::after {
    content: attr(data-desc-top);
    position: absolute;
    bottom: calc(100% + 2px);
    background-color: var(--color-bg-desc-light);
    color: var(--color-desc-light);
    z-index: 2;
    font-size: var(--font-size-after);
    white-space: nowrap;
    text-align: center;
    padding: 4px;
    border-radius: 4px;
    animation: ${keyframes`
      0% {
        opacity : 0;
      }
      95% {
        opacity : 0;
      }
      100% {
        opacity : 1;
      }
    `} 0.5s;
  }

  & button {
    display: flex;
    justify-content: center;
    align-items: center;
    border : none;
    border-radius: 50%;
    padding: 2px;
    background-color: var(--color-chrome);
    color: var(--color-text-primary);
    margin: 2px;
    cursor: pointer;
  }

  & svg {
    width: 8px;
    height: 8px;
  }
}
`

export default App
