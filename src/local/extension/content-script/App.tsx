// import { Echo as ExtEcho } from 'extension/lib/event'
import { FlexCenterDiv, FlexColumnCenterDiv } from 'lib/frame/generic'
import { useCallback, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SetState, UnmountApp } from 'sementic_events'
import styled, { createGlobalStyle, keyframes } from 'styled-components'
import Overlay from './components/Overlay'
import { getEvHandler } from './event/entity/content-event-handler'
import { safeGetBody } from './functions/app'
import Builder from './page/Builder'
import Home from './page/Home'
import { getStore } from './store'
// import { getContentEvHandler } from './content-ev-handler'

const App = () => {
  // const [gy, config, cache] = getStore()(
  //   useCallback((state) => [state.gy, state.config, state.cache], []),
  //   shallow
  // )

  const showDescOnHover = useCallback(function (e: MouseEvent) {
    if (!(e.target instanceof HTMLElement)) return
    const footer = safeGetBody().querySelector('#footer') as HTMLDivElement
    const desc = (e.target as HTMLElement).getAttribute('data-desc2')?.trim()
    if (!footer || !desc) return
    if (footer) footer.innerText = desc
    const cleanup = function () {
      footer.innerText = ''
      e.target?.removeEventListener('mouseleave', cleanup)
    }
    e.target.addEventListener('mouseleave', cleanup)
  }, [])

  const reqUnmount = useCallback(function () {
    const evHandler = getEvHandler()

    const store = getStore().getState()

    console.log('unmounting...\n', 'store: ', store)

    return evHandler.sendEvent<UnmountApp>({
      name: 'UNMOUNT_APP',
      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } },
      payload: store
    })
  }, [])

  // useEffect(function log() {
  //   console.log('App Rendered')
  // })

  // useEffect(
  //   function setWorkdir() {
  //     const workDir = gdr.WORK_DIR?.at(0)?.at(0) || ''

  //     console.log('setting workdir: ', workDir)
  //     const evHandler = getEvHandler()
  //     evHandler.sendEvent<SetWorkDir>({
  //       name: 'SET_WORKDIR',
  //       payload: workDir,
  //       meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
  //     })
  //   },
  //   [gdr.WORK_DIR?.at(0)?.at(0)]
  // )

  useEffect(function () {
    safeGetBody().addEventListener('mouseover', showDescOnHover)

    /**
     * does it invoke also on unmounting?
     */
    window.addEventListener('beforeunload', reqUnmount)

    if (process.env.NODE_ENV !== 'devserver') {
      const evHandler = getEvHandler()
      evHandler.onEvent<SetState>('SET_STATE', function ({ name, payload, meta }) {
        getStore().getState().setState(payload)
      })
    }

    return function () {
      window.removeEventListener('beforeunload', reqUnmount)
      safeGetBody().removeEventListener('mouseover', showDescOnHover)
      if (process.env.NODE_ENV !== 'devserver') {
        const evHandler = getEvHandler()
        evHandler.removeAllEventListenerOn<SetState>('SET_STATE')
      }
    }
  }, [])

  return (
    <Frame id='gatsby-frame' data-theme='light'>
      {/* <PrismTheme /> */}
      <GlobalStyles />
      <Routes>
        <Route path='/*' element={<Home />} />
        <Route path='/builder/:taskId' element={<Builder />} />
      </Routes>
      <Overlay />
      <PushMessageContainer id='push' />
    </Frame>
  )
}

export default App

const Frame = styled(FlexCenterDiv)`
  position: fixed;
  // min-width : 100vw;
  // min-height : 100vh;
  top: 0;
  left: 0;
  background-color: transparent;
  color: var(--text-color-primary);
  font-size: 16px;
`

// const Overlay = styled(FlexColumnCenterDiv)`
//   display: none;
//   width: 100vw;
//   height: 100vh;
//   z-index: 1;
// `

const PushMessageContainer = styled(FlexColumnCenterDiv)`
  position: fixed;
  z-index: 999;
  bottom: 50%;
  right: 0;
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

  @media (max-width: 960px) {
    font-size: 12px;
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

    --padding-large: 1em;
    --padding-default: 0.5em;
    --padding-small: 0.25em;
    --padding-xsmall: 0.125em;
    --margin-default: 0.5em;
    --margin-small: 0.25em;
    --margin-xsmall: 0.125em;

    --border-radius-default: 8px;

    --svg-size-default: 20px;
    --svg-size-menu: 20px;
    --svg-size-panel: 16px;
    --svg-size-nav: 16px;
    --svg-size-option: 12px;

    --font-size-default: 1em;
    --font-size-small: 0.625em;
    --font-size-menu: 16px;
    --font-size-after: 0.75em;

    --shadow-dropdown: 0 0px 10px rgb(64 64 64 / 15%);

    --scroll-track-size-default: 6px;
    --scroll-track-size-small: 5px;

    --color-dark5: #888;
    --color-dark6: #555;
    --color-light-grey: #e0e0e0;
    --color-light-grey2: #f0f0f0;

    --size-xlarge: 1.5em;
    --size-large: 1em;
    --size-default: 0.5em;
    --size-small: 0.25em;
    --size-xsmall: 0.125em;
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

  // [data-desc] {
  //   &:hover::before {
  //     content: attr(data-desc);
  //     position: absolute;
  //     top : 100%;
  //     border-radius:4px;
  //     font-size : 12px;
  //     background-color : grey;
  //     color: black;
  //   }
  // }

  .none {
    display : none;
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

// const PrismTheme = createGlobalStyle`
//   code[class*="language-"],
//   pre[class*="language-"] {
//     color: black;
//     background: none;
//     text-shadow: 0 1px white;
//     font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
//     font-size: 1em;
//     text-align: left;
//     white-space: pre;
//     word-spacing: normal;
//     word-break: normal;
//     word-wrap: normal;
//     line-height: 1.5;

//     -moz-tab-size: 4;
//     -o-tab-size: 4;
//     tab-size: 4;

//     -webkit-hyphens: none;
//     -moz-hyphens: none;
//     -ms-hyphens: none;
//     hyphens: none;
//   }

//   pre[class*="language-"]::-moz-selection, pre[class*="language-"] ::-moz-selection,
//   code[class*="language-"]::-moz-selection, code[class*="language-"] ::-moz-selection {
//     text-shadow: none;
//     background: #b3d4fc;
//   }

//   pre[class*="language-"]::selection, pre[class*="language-"] ::selection,
//   code[class*="language-"]::selection, code[class*="language-"] ::selection {
//     text-shadow: none;
//     background: #b3d4fc;
//   }

//   @media print {
//     code[class*="language-"],
//     pre[class*="language-"] {
//       text-shadow: none;
//     }
//   }

//   /* Code blocks */
//   pre[class*="language-"] {
//     padding: 1em;
//     margin: .5em 0;
//     overflow: auto;
//   }

//   :not(pre) > code[class*="language-"],
//   pre[class*="language-"] {
//     background: #f5f2f0;
//   }

//   /* Inline code */
//   :not(pre) > code[class*="language-"] {
//     padding: .1em;
//     border-radius: .3em;
//     white-space: normal;
//   }

//   .token.comment,
//   .token.prolog,
//   .token.doctype,
//   .token.cdata {
//     color: slategray;
//   }

//   .token.punctuation {
//     color: #999;
//   }

//   .token.namespace {
//     opacity: .7;
//   }

//   .token.property,
//   .token.tag,
//   .token.boolean,
//   .token.number,
//   .token.constant,
//   .token.symbol,
//   .token.deleted {
//     color: #905;
//   }

//   .token.selector,
//   .token.attr-name,
//   .token.string,
//   .token.char,
//   .token.builtin,
//   .token.inserted {
//     color: #690;
//   }

//   .token.operator,
//   .token.entity,
//   .token.url,
//   .language-css .token.string,
//   .style .token.string {
//     color: #9a6e3a;
//     /* This background color was intended by the author of this theme. */
//     background: hsla(0, 0%, 100%, .5);
//   }

//   .token.atrule,
//   .token.attr-value,
//   .token.keyword {
//     color: #07a;
//   }

//   .token.function,
//   .token.class-name {
//     color: #DD4A68;
//   }

//   .token.regex,
//   .token.important,
//   .token.variable {
//     color: #e90;
//   }

//   .token.important,
//   .token.bold {
//     font-weight: bold;
//   }
//   .token.italic {
//     font-style: italic;
//   }

//   .token.entity {
//     cursor: help;
//   }
// `
