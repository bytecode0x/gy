import Loader from 'lib/asset/svg/Loader'
import { FlexCenterDiv, FlexColumnCenterDiv, FlexColumnDiv, FlexDiv, TextArea, TextButton } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import { pushMessage } from 'lib/util/dom/render'
import { safeGetBody } from 'local/extension/content-script/functions/app'
import { getStore } from 'local/extension/content-script/store'
import { FC, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import shallow from 'zustand/shallow'

const Container = styled(FlexColumnDiv)`
  align-items: stretch;
  justify-content: center;
  position: relative;
  flex: 1;
  min-width: 0;
`

const AligningContainer = styled(FlexColumnCenterDiv)`
  flex: 1;
`

const OutputLayer = styled(FlexDiv)`
  flex: 1;
  min-height: 0;
`

const MessageContainer = styled(FlexColumnDiv)`
  flex: 1;
  overflow: scroll;

  align-items: stretch;

  ${SCROLL}
`

const UserMessage = styled(FlexDiv)`
  justify-content: flex-end;
  padding: 6px;
  margin-left: 32px;
  text-align: right;
`

const AssistantMessage = styled(TextButton)`
  justify-content: flex-start;
  margin-right: 32px;
  text-align: left;
`

const Message = styled.pre`
  white-space: break-spaces;
  font-size: 12px;
`

const InputLayer = styled(FlexDiv)`
  height: 60px;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
`

const InputContainer = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;

  & textarea::placeholder {
    font-size: 14px !important;
    font-style: italic;
  }
  & textarea {
    flex: 1;
    outline: none;
    border: none;
    margin: 0 8px;
    text-align: start;
    ${SCROLL}
  }
`

const ButtonContainer = styled(FlexColumnDiv)`
  // flex: 1;
  justify-content: center;
  align-items: center;

  & svg {
    color: grey;
    width: 20px;
    height: 20px;
  }

  & > * {
    flex: 1;
  }
`

const ExecuteButton = styled(TextButton)``

type AssistantProps = {
  assistantId: string
  additionalContext?: string
}

const Assistant: FC<AssistantProps> = ({ assistantId, additionalContext }) => {
  const [gy, setState] = getStore()(
    useCallback((state) => [state.gy, state.setState], []),
    shallow
  )

  const [thread, setThread] = useState<string>()

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; message: string }>>([])

  const [instructions, setInstructions] = useState<string>('')

  const [disable, setDisable] = useState<boolean>(false)

  const copy: React.MouseEventHandler<HTMLButtonElement> = useCallback(function (e) {
    navigator.clipboard.writeText(e.currentTarget.textContent || '').then(
      function onSuccess() {
        return pushMessage({
          message: `클립보드로 복사되었습니다`,
          layer: safeGetBody().querySelector('#push')
        })
      },
      function onFail() {
        return pushMessage({
          message: `클립보드로 복사에 실패했습니다`,
          layer: safeGetBody().querySelector('#push')
        })
      }
    )
  }, [])

  const createThread = useCallback(function (apiKey: string) {
    return new Promise<string>(function (resolve, reject) {
      fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      })
        .then((res) => res.json())
        .then((obj) =>
          'id' in obj
            ? resolve(obj.id)
            : reject(new Error(obj?.error?.message || 'unknown error occurred creating a thread'))
        )
    })
  }, [])

  const appendMessage = useCallback(function (apiKey: string, thread: string, message: string) {
    return fetch(`https://api.openai.com/v1/threads/${thread}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        role: 'user',
        content: message
      })
    })
  }, [])

  /**
   * this functions returns runId on success
   * and It is used for checking the run is resolved or not
   */
  const runThread = useCallback(function (apiKey: string, thread: string) {
    return new Promise<string>(function (resolve, reject) {
      fetch(`https://api.openai.com/v1/threads/${thread}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          // assistant_id: 'asst_e288RFXTXyN1GPEnLyJzsnWj'
          assistant_id: assistantId
          // you shouldn't involve instructions, It will override
          // instructions
        })
      })
        .then((res) => res.json())
        .then((obj) =>
          'id' in obj
            ? resolve(obj.id)
            : reject(new Error(obj?.error?.message || 'unknown error occurred running a thread'))
        )
    })
  }, [])

  const checkRun = useCallback(function (apiKey: string, thread: string, run: string) {
    return new Promise<boolean>(function (resolve, reject) {
      fetch(`https://api.openai.com/v1/threads/${thread}/runs/${run}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      })
        .then((res) => res.json())
        .then((obj) =>
          'status' in obj
            ? resolve(obj.status === 'completed')
            : reject(new Error(obj?.error?.message || 'unknown error occurred checking status'))
        )
    })
  }, [])

  const getMessages = useCallback(function (
    apiKey: string,
    thread: string
  ): Promise<Array<{ role: 'assistant' | 'user'; message: string }>> {
    return new Promise(function (resolve, reject) {
      fetch(`https://api.openai.com/v1/threads/${thread}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      })
        .then((res) => res.json())
        .then((obj) =>
          'data' in obj
            ? resolve(
                (
                  obj.data as Array<{
                    type: string
                    role: 'assistant' | 'user'
                    content: Array<{ text: { value: string } }>
                  }>
                ).map(({ role, content }) => ({ role, message: content.map(({ text }) => text.value).join('\n') }))
              )
            : reject(new Error(obj?.error?.message || 'unknown error occurred getting messages'))
        )
    })
  },
  [])

  useEffect(
    function initThread() {
      const apiKey = gy.gdr.GPT_API_KEY?.at(0)?.at(0)

      if (!apiKey) return

      createThread(apiKey)
        .then(function (thread) {
          setThread(thread)
          // setState({ gdr: { ...gdr, EFFECT_THREAD: [[thread]] } })
        })
        .catch(function (err) {
          pushMessage({
            message: `invalid script${err?.message ? `\n${err.message}` : ''}`,
            layer: safeGetBody().querySelector('#push')
          })
        })
    },
    [gy.gdr.GPT_API_KEY?.at(0)?.at(0)]
  )

  // useEffect(function log() {
  //   console.log('context : ', additionalContext)
  // }, [])

  if (!gy.gdr.GPT_API_KEY?.at(0)?.at(0))
    return (
      <AligningContainer>
        <TextButton
          data-desc2='ChatGPT API Key 가 등록되어야 합니다'
          onClick={function () {
            const key = window.prompt('ChatGPT API Key 값을 입력하세요')
            if (!key) return
            setState({
              gy: {
                ...gy,
                gdr: { ...gy.gdr, GPT_API_KEY: [[key]] }
              }
            })
          }}
        >
          API KEY 등록
        </TextButton>
      </AligningContainer>
    )

  if (!thread)
    return (
      <AligningContainer>
        <Loader />
      </AligningContainer>
    )

  return (
    <Container>
      <OutputLayer>
        <MessageContainer>
          <AssistantMessage>
            {`안녕하세요 저는 이펙트 작성을 도와드리기 위한 ChatGPT 어시스턴트 입니다\n무엇을 도와드릴까요?`}
          </AssistantMessage>
          {/* <AssistantMessage>
            <Message>
              {
                "// Path for the folder to save the Excel files\nconst dir = '엑셀을 저장할 폴더 경로'\n\n// Create the Excel file with today's date as the file name\nconst d = new Date()\nconst year = d.getFullYear()\nconst month = (d.getMonth() + 1).toLocaleString(undefined, { minimumIntegerDigits: 2})\nconst date = d.getDate().toLocaleString(undefined, { minimumIntegerDigits: 2})\nconst excelFile = `${year}${month}${date}.xlsx`\nconst fullPath = dir + '\\\\' +excelFile\nconst wb = await createWorkbook(fullPath)\nlet ws = await wb.getWorksheet(0)\nif(!ws) ws = await wb.createWorksheet('sheet1')\n\n// Loop through the data and process each node\nfor ( const [index, sequence] of generateSequence(tree) ) {\n  // Access the data from the sequence using pseudo names\n  const author = stringify(sequence['글 작성자를 나타내는 대체수'])\n  const title = stringify(sequence['글 제목을 나타내는 대체수'])\n  const content = stringify(sequence['글 내용을 나타내는 대체수'])\n  const views = stringify(sequence['조회수를 나타내는 대체수'])\n  const likes = stringify(sequence['좋아요 수를 나타내는 대체수'])\n\n  // Translate the data if needed\n  const row = await Promise.all([author, title, content, views, likes].map((v) => translate(v, 'source-lang-code', 'target-lang-code')))\n\n  // Append the translated data to the Excel worksheet\n  await ws.appendRow(row)\n\n  // Create a folder for each cafe\n  const cafeFolder = `${dir}\\\\${author}`\n  await mkdir(cafeFolder)\n}\n\n// Save the Excel file\nawait wb.save(`${dir}\\\\${excelFile}`"
              }
            </Message>
          </AssistantMessage> */}
          {messages.map(({ role, message }, index) =>
            role === 'assistant' ? (
              <AssistantMessage onClick={copy} key={index}>
                <Message>{message}</Message>
              </AssistantMessage>
            ) : (
              <UserMessage key={index}>{message}</UserMessage>
            )
          )}
        </MessageContainer>
      </OutputLayer>
      <InputLayer>
        <InputContainer>
          <TextArea
            id='assistant-input'
            placeholder='어시스턴트에게 이펙트 작성을 맡겨보세요'
            value={instructions}
            onChange={function (e) {
              setInstructions(e.currentTarget.value)
            }}
          />
          <ButtonContainer>
            <FlexCenterDiv>{disable && <Loader />}</FlexCenterDiv>
            <ExecuteButton
              disabled={disable}
              onClick={async function (e) {
                try {
                  const apiKey = gy.gdr.GPT_API_KEY?.at(0)?.at(0)
                  const ta = safeGetBody().querySelector('#assistant-input') as HTMLTextAreaElement
                  if (!ta || !apiKey || !thread) return

                  setDisable(true)
                  if (additionalContext && messages.length === 0) await appendMessage(apiKey, thread, additionalContext)
                  await appendMessage(apiKey, thread, ta.value)
                  const runId = await runThread(apiKey, thread)

                  await new Promise<void>(function (resolve) {
                    const interval = window.setInterval(async function () {
                      const isResolved = await checkRun(apiKey, thread, runId)
                      if (!isResolved) return
                      window.clearInterval(interval)
                      resolve()
                    }, 3000)
                  })

                  const dialog = await getMessages(apiKey, thread)

                  console.log(JSON.stringify(dialog))

                  setMessages(
                    dialog
                      .slice(0, additionalContext ? -1 : undefined)
                      .reverse()
                      .map((msg) =>
                        msg.role === 'user'
                          ? msg
                          : msg.message.startsWith('```javascript')
                          ? { ...msg, message: msg.message.slice('```javascript'.length, -1 * '```'.length) }
                          : msg
                      )
                  )
                } catch (err: any) {
                  pushMessage({
                    message: `어시스턴트 실행에 실패했습니다\n${err?.message || ''}`,
                    layer: safeGetBody().querySelector('#push'),
                    autoRemove: process.env.NODE_ENV === 'production'
                  })
                } finally {
                  // Cannot set properties of null (setting 'disabled')
                  // e.currentTarget.disabled = false
                  setInstructions('')
                  setDisable(false)
                }
              }}
            >
              실행
            </ExecuteButton>
          </ButtonContainer>
        </InputContainer>
      </InputLayer>
    </Container>
  )
}

export default Assistant
