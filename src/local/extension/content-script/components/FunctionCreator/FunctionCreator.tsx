import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Span, TextArea, TextButton } from 'lib/frame/generic'
import { Border, TextAreaLayout1, TextButtonsLayout1 } from 'lib/frame/sementic'
import { SCROLL } from 'lib/styled-css-property'
import { FC, useState } from 'react'
import styled from 'styled-components'
import { ZodType } from 'zod'
// import 'prismjs/components/prism-clike'
// import 'prismjs/components/prism-javascript'
// you need to append it to styled component global style manually
// import 'prismjs/themes/prism.css'

const Container = styled(FlexColumnDiv)`
  max-height: 800px;
  max-width: 800px;
  aspect-ratio: 1;
  // height: 75vh;
  width: 75vw;

  padding: var(--padding-default, 8px);
  background-color: white;
  font-size: 12px;
  box-shadow: var(--shadow-elevation4);
  border-radius: var(--border-radius-default, 8px);

  min-height: 0;
  min-width: 450px;

  & textarea::placeholder {
    font-size: 28px;
    font-style: italic;
  }
`
const OuterBorder = styled(Border)`
  flex: 1;

  & > *:not(:first-child) {
    margin-top: 12px;
  }
`

const Header = styled(Span)`
  font-size: 16px;
  font-weight: bold;
  // font-style: italic;
`

const Layout = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;

  & > *:not(:first-child) {
    margin-left: 8px;
  }
`

const ContextLayout = styled(FlexColumnDiv)`
  flex: 1;
  min-width: 200px;
  min-height: 0;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: 4px;
  overflow: scroll;
  ${SCROLL}
`
const ParametersLayout = styled(FlexColumnDiv)`
  // border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
`

const Parameter = styled(FlexColumnDiv)`
  align-items: start;

  & > button {
    font-size: 14px;
    padding: 4px 5px;
    background-color: lightgray;
  }

  & > span:nth-of-type(1) {
    font-size: 12px;
    // font-weight: bold;
    font-style: italic;
  }
`

const ReturnTypeLayout = styled(FlexColumnDiv)`
  // border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
`

const FunctionTemplate = styled(Span)``

const ReturnType = styled(Span)`
  font-size: 12px;
  // font-weight: bold;
  font-style: italic;
`

const ConsoleLayer = styled(FlexDiv)`
  flex: 1;
  min-height: 0;
  padding: 4px;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  overflow: scroll;
  ${SCROLL}
`

const AssistantLayer = styled(FlexDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  overflow: scroll;
  min-height: 0;
  padding: 4px;
  ${SCROLL}
`

const Log = styled.pre`
  white-space: pre;
  font-size: 12px;
`

type FunctionCreatorProps = {
  placeholder?: string
  name?: string
  initial?: string
  async?: boolean
  parameters?: Array<{ id: string; type: string; snapshot: any }>
  global?: Array<{ id: string; type: string; snapshot: any }>
  returnType: { label: string; scheme: ZodType }
  onResolve: (sanitized: string, snapshotValue: any, async?: boolean) => any
  onReject: (reason: string) => any
  onPreflight?: (
    sanitized: string,
    params: Array<{ id: string; type: string; snapshot: any }>,
    async?: boolean
  ) => Promise<any>
}

const FunctionCreator: FC<FunctionCreatorProps> = ({
  placeholder,
  initial,
  async,
  name,
  parameters = [],
  global = [],
  returnType,
  onResolve,
  onReject,
  onPreflight
}) => {
  const [code, setCode] = useState<string>(initial || '')
  // const [async, setAsync] = useState<boolean>()
  // const [validated, setValidated] = useState<boolean>(false)
  const [log, setLog] = useState<string>('')
  const [snapshot, setSnapshot] = useState<any>()

  return (
    <Container>
      <OuterBorder>
        <TextButtonsLayout1>
          <FlexCenterDiv>
            <TextButton
              type='button'
              onClick={function (e) {
                onResolve(code.replace('eval', 'String').replace('Function', 'String'), snapshot, async)
              }}
            >
              확인
            </TextButton>
            <TextButton
              type='button'
              onClick={function (e) {
                onReject('canceled by user')
              }}
            >
              취소
            </TextButton>
          </FlexCenterDiv>
          <FlexCenterDiv>
            {onPreflight && (
              <TextButton
                data-desc='현재 탭에서 스냅샷을 매개변수로 함수를 실행합니다'
                // disabled={!code}
                onClick={function (e) {
                  return onPreflight(code.replace('eval', 'String').replace('Function', 'String'), parameters, async)
                    .catch(function (err) {
                      console.log('preflight err : ', err)
                      // pushMessage({
                      //   message: `invalid script${err?.message ? `\n${err.message}` : ''}`,
                      //   layer: safeGetBody().querySelector('#push')
                      // })
                      setLog(err?.message?.split('\n').at(0) || '')
                      // setValidated(false)
                    })
                    .then(function ([returnValue, url]: [any, string]) {
                      const parse = returnType.scheme.safeParse(returnValue)

                      // console.log('returnValue : ', returnValue)
                      setLog(JSON.stringify(returnValue, null, 2))

                      if ('error' in parse) {
                        // setValidated(false)

                        console.log('error: ', parse)

                        // return parse.error!.issues.forEach((issue) =>
                        //   pushMessage({
                        //     message: `리턴 값이 올바르지 않습니다${
                        //       'expected' in issue ? `\n${issue.expected} type required` : ''
                        //     }`,
                        //     layer: safeGetBody().querySelector('#push')
                        //   })
                        // )
                      }

                      // setValidated(true)
                      setSnapshot(returnValue)
                    })
                }}
              >
                테스트
              </TextButton>
            )}
          </FlexCenterDiv>
        </TextButtonsLayout1>
        <Layout>
          <TextAreaLayout1>
            <FunctionTemplate>
              {`${async ? 'async function' : 'function'} ${name || 'callback'} (${parameters
                .map((param) => param.id)
                .join(', ')}) {`}
            </FunctionTemplate>
            <TextArea
              autoFocus
              spellCheck={false}
              placeholder={placeholder}
              value={code}
              onChange={(e) => {
                // setValidated(false)
                setCode(e.target.value)
              }}
            />
            {/* <EditorContainer>
              <Editor
                value={code}
                onValueChange={(code) => setCode(code)}
                highlight={(code) => highlight(code, languages.js, 'js')}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 12
                }}
              />
            </EditorContainer> */}
            <FunctionTemplate>{'}'}</FunctionTemplate>
          </TextAreaLayout1>
          <ContextLayout>
            {parameters.length !== 0 && (
              <ParametersLayout>
                <Header>Parameters</Header>
                {parameters.map((param, index) => (
                  <Parameter key={index}>
                    <TextButton
                      data-desc='테스트에 쓰이는 스냅샷을 출력합니다'
                      onClick={function () {
                        setLog(JSON.stringify(param.snapshot, null, 2))
                      }}
                    >
                      {param.id}
                    </TextButton>
                    <Span>{param.type}</Span>
                  </Parameter>
                ))}
              </ParametersLayout>
            )}
            {global.length !== 0 && (
              <ParametersLayout>
                <Header>Global</Header>
                {global.map((param, index) => (
                  <Parameter key={index}>
                    <TextButton
                      data-desc='테스트에 쓰이는 스냅샷을 출력합니다'
                      onClick={function () {
                        setLog(JSON.stringify(param.snapshot, null, 2))
                      }}
                    >
                      {param.id}
                    </TextButton>
                    <Span>{param.type}</Span>
                  </Parameter>
                ))}
              </ParametersLayout>
            )}
            <ReturnTypeLayout>
              <Header>Return type</Header>
              <ReturnType>{returnType.label}</ReturnType>
            </ReturnTypeLayout>
          </ContextLayout>
        </Layout>
        <Layout>
          <ConsoleLayer>
            <Log>{log}</Log>
          </ConsoleLayer>
        </Layout>
      </OuterBorder>
    </Container>
  )
}

export default FunctionCreator
