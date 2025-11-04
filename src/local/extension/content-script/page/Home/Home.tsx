/* eslint-disable react/no-unstable-nested-components */
import PullLeft from 'lib/asset/svg/PullLeft'
import { Shrinker } from 'lib/component/Shrinker'
import { Div, FlexCenterDiv, FlexColumnDiv, FlexDiv } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import GlobalUtility from 'local/extension/content-script/components/GlobalUtility'
import { getEvHandler } from 'local/extension/content-script/event/entity/content-event-handler'
import { getStore, setOverlay } from 'local/extension/content-script/store'
import { useCallback, useEffect, useRef } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { UnmountApp } from 'sementic_events'
import styled from 'styled-components'
import AuthState from '../../components/Auth'
import Navigator from '../../components/Navigator'
import ConfigurationPage from './ConfigurationPage'
import ProcedurePage from './ProcedurePage'
import ProcedureFlow from './ProcedurePage/Flow'
import ScriptPage from './ScriptPage/ScriptPage'

const Layer = styled(FlexCenterDiv)`
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  position: fixed;
`

const Container = styled(FlexColumnDiv)`
  flex: 1;
  align-items: stretch;
  position: fixed;
  background-color: white;
  width: 75vw;
  height: 75vh;

  border-radius: 16px 16px 0 0;
  box-shadow: var(--shadow-elevation4);
  z-index: 1;
`

const Header = styled(FlexCenterDiv)`
  height: 60px;
  justify-content: space-between;
  background-color: var(--color-theme-primary);
  box-shadow: var(--shadow-elevation2);
  -webkit-app-region: drag;
  padding: 0 40px 0 60px;
  background-color: grey;
  border-radius: 16px 16px 0 0;
  // border-bottom: 1px solid var(--color-border-base);
`

const Content = styled(FlexDiv)`
  flex: 1;
  position: relative;
  z-index: 1;
  justify-content: flex-start;
  align-items: stretch;
  min-height: 150px;
  min-width: 0;
  background-color: var(--color-light-grey2);
  border-bottom: 1px solid var(--color-border-base);
`
const ContentMiddle = styled(FlexColumnDiv)`
  z-index: 0;
  position: relative;
  // min-height: 300px;
  align-items: stretch;
  flex: 1;
  min-height: 0;

  padding: 0.5em;
  overflow: scroll;
  ${SCROLL}
`

const ContentMiddleMargin = styled(FlexColumnDiv)`
  flex: 1;
  position: relative;
  align-items: stretch;
  margin: 0.5em;
`

const ContentBottom = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
`

const Footer = styled(FlexDiv)`
  height: 20px;
  background-color: var(--color-theme-primary);
  font-size: 14px;
  padding: 0 0.5em;
`

export const Unit = styled(FlexCenterDiv)`
  flex: 1;
  padding: 12px;
  border: 0 solid black;
  & + & {
    border-left-width: 1px;
  }
`

export const TableHeader = styled(FlexCenterDiv)`
  border: 1px solid black;
  justify-content: stretch;
  align-items: stretch;
  position: relative;
  & + & {
    border-top-width: 0;
  }
`

const Utilities = styled(FlexDiv)`
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  // padding-right: 150px;
  color: black;

  & > * {
    -webkit-app-region: no-drag;
  }

  & > * {
    margin: 0 2px;
  }

  & svg {
    width: 18px;
    height: 18px;
  }
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
  padding: 1em;
  overflow: hidden;

  & > div {
    margin-top: 1em;
    height: auto;
    width: 100%;
  }
`

const SNSContainer = styled(FlexDiv)`
  align-items: center;
  justify-content: center;
  margin: 0 6px;
  & > svg {
    width: 24px;
    height: 24px;
    margin: 0 6px;
  }
`

const Locator = styled(Div)`
  position: relative;
`

const GlobalUtilityLayer = styled(FlexDiv)`
  padding: 4px 12px;
  align-items: center;
  position: sticky;
  left: 0;
  z-index: 9999;
`

const OverlayTest1 = styled(FlexDiv)`
  width: 500px;
  aspect-ratio: 1;
  background-color: red;
`

const OverlayTest2 = styled(FlexDiv)`
  width: 400px;
  aspect-ratio: 1;
  background-color: blue;
`

const OverlayTest3 = styled(FlexDiv)`
  width: 300px;
  aspect-ratio: 1;
  background-color: yellow;
`
const Home = () => {
  const unmountApp: React.MouseEventHandler<HTMLDivElement> = useCallback(function (e) {
    if (e.currentTarget !== e.target) return

    const evHandler = getEvHandler()
    evHandler.sendEvent<UnmountApp>({
      name: 'UNMOUNT_APP',
      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } },
      payload: getStore().getState()
    })
  }, [])

  const stopPropagation: React.MouseEventHandler<HTMLDivElement> = useCallback(function (e) {
    /**
     * It stops the events from going further down
     */
    e.stopPropagation()
  }, [])

  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // useEffect(function log() {
  //   console.log('Home Rendered')
  // })

  useEffect(function () {
    if (process.env.NODE_ENV === 'devserver') {
      setOverlay(<OverlayTest1>overlay1</OverlayTest1>, function () {
        console.log('overlay1 cleared')
      })
      setOverlay(<OverlayTest2>overlay2</OverlayTest2>, function () {
        console.log('overlay2 cleared')
      })
      setOverlay(<OverlayTest3>overlay3</OverlayTest3>, function () {
        console.log('overlay3 cleared')
      })
      // navigate('/procedures')
      // navigate('/builder/1959e0a9-88ee-410e-a633-9f263477cac5')
      // setOverlay(
      //   <>
      //     <Form
      //       header='Test'
      //       form={{
      //         string: (getter, setter, close) => (
      //           <StringInput
      //             onResolve={function (raw) {
      //               console.log('raw : ', raw)
      //               setter(raw)
      //               close()
      //             }}
      //             onReject={function (reason) {
      //               console.log(getter())
      //               close()
      //             }}
      //             snapshot={{}}
      //           />
      //         ),
      //         matrix: (getter, setter, close) => (
      //           <MatrixInput
      //             onResolve={function (raw, matrix) {
      //               console.log('raw : ', raw, 'matrix : ', matrix)
      //               setter(raw)
      //               close()
      //             }}
      //             onReject={function (reason) {
      //               console.log(getter())
      //               close()
      //             }}
      //             snapshot={{}}
      //           />
      //         )
      //       }}
      //       onResolve={function (formData) {
      //         console.log('formData : ', formData)
      //       }}
      //       onReject={function () {}}
      //       onPreflight={function () {
      //         return Promise.resolve(true)
      //       }}
      //     />
      //     {/* <SubstituteNameInput
      //       substitutes={['abc', 'test']}
      //       title='대체수(Substitute)명을 입력하세요'
      //       placeholder='테스트'
      //       onResolve={function (name) {
      //         console.log(`name : ${name}`)
      //       }}
      //       onReject={function (reason) {
      //         console.log('rejected : ', reason)
      //       }}
      //     /> */}
      //     {/* <StringInput
      //         initial='initial'
      //         snapshot={{ a: [['1'], ['2']], b: [['3', '4', '5']] }}
      //         placeholder='테스트'
      //         onResolve={function (raw, evaluated) {
      //           console.log(`raw : ${raw}\nevaluated : ${evaluated}`)
      //         }}
      //         onReject={function (reason) {
      //           console.log('rejected : ', reason)
      //         }}
      //       />
      //       <MatrixInput
      //         initial='initial'
      //         snapshot={{ a: [['1'], ['2']], b: [['3', '4', '5']] }}
      //         placeholder='테스트'
      //         onResolve={function (raw, matrix) {
      //           console.log(`raw : ${raw}\nmatrix : ${matrix}`)
      //         }}
      //         onReject={function (reason) {
      //           console.log('rejected : ', reason)
      //         }}
      //       /> */}
      //     {/* <Select
      //         header='Select Test'
      //         options={['1', '2', 'skldjflksjflskjfslkjflskjfslkfjsdlkfl']}
      //         onResolve={function (chosens) {
      //           console.log(chosens)
      //         }}
      //         onReject={function (reason) {
      //           console.log(reason)
      //         }}
      //       /> */}
      //   </>
      // )
    }
  }, [])

  return (
    <Layer onClick={unmountApp}>
      <Container>
        <Header>
          {/* <LogoContainer> */}
          {/* <Anchor href='https://project-gatsby.com'>
            <DeveloperLogo desc2='https://project-gatsby.com' />
          </Anchor> */}

          {/* </LogoContainer> */}
          <SNSContainer>
            {/* <Youtube />
            <Discord />
            <Instagram /> */}
          </SNSContainer>
          <Utilities>
            {/* <ControlButton /> */}
            <AuthState />
            {/* <OpenWorkDir />
            <Link to='/'>
              <SVGButton data-desc2='작업 설정'>
                <Message1 />
              </SVGButton>
            </Link> */}
            {/* <Link to='/workspace'>
            <SVGButton data-desc2='작업 설정'>
              <Settings />
            </SVGButton>
          </Link> */}
            {/* <Link to='/config'>
              <SVGButton data-desc2='프로그램 설정'>
                <Settings />
              </SVGButton>
            </Link> */}
          </Utilities>
        </Header>
        <Content id='content'>
          <Navigator ref={ref} />
          <Locator>
            <Shrinker
              direction='horizontal'
              target={ref}
              cssFrame={{ position: 'absolute', zIndex: 1 }}
              cssExtending={{ top: 0, right: 0 }}
              cssShrinking={{ top: 0, left: 0, transform: 'rotate(180deg)' }}
            >
              <PullLeft />
            </Shrinker>
          </Locator>
          <ContentMiddle id='content-middle'>
            <GlobalUtilityLayer>
              <GlobalUtility />
            </GlobalUtilityLayer>
            <Routes>
              {/* <Route path='/' element={<ProcedurePage />} /> */}
              {/* <Route path='/trigger' element={<Trigger />} /> */}
              <Route path='/procedure' element={<ProcedurePage />} />
              <Route path='/procedure/flow/:id' element={<ProcedureFlow />} />

              <Route path='/script' element={<ScriptPage />} />
              {/* <Route path='/schedule/flow/:id' element={<TriggerFlow />} /> */}
              <Route path='/configuration' element={<ConfigurationPage />} />
            </Routes>
          </ContentMiddle>
        </Content>
        <Footer id='footer' />
      </Container>
    </Layer>
  )
}

export default Home
