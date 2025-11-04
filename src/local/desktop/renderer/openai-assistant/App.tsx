import Loader from 'lib/asset/svg/Loader'
import {
  Div,
  FlexCenterDiv,
  FlexColumnCenterDiv,
  FlexColumnDiv,
  FlexDiv,
  Form,
  Input,
  Label,
  Span,
  TextArea,
  TextButton
} from 'lib/frame/generic'
import { Border, TextButtonsLayout1 } from 'lib/frame/sementic'
import { SCROLL } from 'lib/styled-css-property'
import { overlayLoader } from 'lib/util/dom/render'
import { __Action__OpenAIAssistant } from 'local/desktop/main/gy/type/action.preset'
import OpenAI from 'openai'
import { RunCreateParamsBase } from 'openai/resources/beta/threads/runs/runs'
import { Thread } from 'openai/resources/beta/threads/threads'
import { useEffect, useRef, useState } from 'react'
import { CloseWindow, Fulfill, InitializeProcess, OpenDialog, RendererReady, WriteFile } from 'sementic_events'
import styled from 'styled-components'

const AssistantApp = () => {
  const [openai, setOpenAI] = useState<OpenAI | null>(null)
  const [assistantInfo, setAssistantInfo] = useState<OpenAI.Beta.Assistants.Assistant | null>(null)

  const [threadLock, setThreadLock] = useState<boolean>(false)
  const [messages, setMessages] = useState<OpenAI.Beta.Threads.Messages.Message[]>([])
  const [inputMessages, setInputMessages] = useState<OpenAI.Beta.Threads.ThreadCreateParams.Message[]>([])
  const [textInput, setTextInput] = useState<string>('')
  const [files, setFiles] = useState<File[]>([])

  const refs = useRef<
    Partial<{
      thread: Thread
      toolChoice: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['tool_choice']
      tools: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['tools']
      model: RunCreateParamsBase['model']
      assistantId: string
      apiKey: string
      callId: string
      runId: string
      temperature: number
      responseFormat: OpenAI.Beta.Threads.Runs.RunCreateParamsNonStreaming['response_format']
      toolBinding: __Action__OpenAIAssistant['value']['options']['toolBinding']
    }>
  >({}).current

  useEffect(function fetch() {
    /**
     * fetching with expect can guarantee the synchrounous on the rendering and display
     * as the main is not able to know It's rendered or not
     */
    // window.eh.sendEvent<Expect<Assistant['value']>>({
    //   name: 'EXPECT',
    //   payload: { channel: 'assistant' },
    //   meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
    // })

    console.log('renderer id: ', window.eh.id)

    window.eh
      .sendEvent<RendererReady<__Action__OpenAIAssistant['value']>>({
        name: 'RENDERER_READY',
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
        payload: window.eh.id as number
      })
      .then(async function init({
        options: {
          apiKey,
          assistantId,
          model,
          temperature,
          initialMessage,
          responseFormat,
          toolChoice,
          tools,
          toolBinding
        }
      }) {
        // eslint-disable-next-line new-cap

        console.log('initializing...\n', 'apiKey: ', apiKey, '\nassistantId: ', assistantId)

        const openai = window.initOpenAI(apiKey)
        refs.apiKey = apiKey
        refs.assistantId = assistantId
        refs.model = model
        refs.temperature = temperature || 1
        refs.responseFormat = responseFormat
        refs.toolChoice = toolChoice
        refs.tools = tools
        refs.toolBinding = toolBinding

        const messages: OpenAI.Beta.Threads.ThreadCreateParams.Message[] = []

        if (initialMessage) messages.push({ role: 'user', content: [{ type: 'text', text: initialMessage }] })

        const thread = await openai.beta.threads.create({
          messages
        })

        const assistantInfo = await openai.beta.assistants.retrieve(assistantId)

        console.log('assistant: ', assistantInfo)

        setAssistantInfo(assistantInfo)

        setMessages(
          await openai.beta.threads.messages
            .list(thread.id, {
              order: 'asc'
            })
            .then((res) => res.data)
        )

        console.log('thread id: ', thread.id)
        refs.thread = thread
        setOpenAI(openai)
      })
  }, [])

  useEffect(
    function scroll() {
      document.querySelector(`${MessageContainer} > ${AssistantMessage}:last-of-type`)?.scrollIntoView()
    },
    [messages]
  )

  return (
    <Container
      onSubmit={function (e) {
        const textContent = new FormData(e.currentTarget).get('message')?.toString()

        if (!textContent) return

        const response = JSON.parse(textContent)

        console.log('message type: ', typeof textContent)
        console.log('selected message: \n', textContent)

        /**
         * training dataset format
         * {"messages": [{"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "What's the capital of France?"}, {"role": "assistant", "content": "Paris, as if everyone doesn't know that already."}]}
         * {"messages": [{"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "Who wrote 'Romeo and Juliet'?"}, {"role": "assistant", "content": "Oh, just some guy named William Shakespeare. Ever heard of him?"}]}
         * {"messages": [{"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "How far is the Moon from Earth?"}, {"role": "assistant", "content": "Around 384,400 kilometers. Give or take a few, like that really matters."}]}
         */

        window.eh
          .sendEvent<Fulfill<any>>({
            name: 'FULFILL',
            payload: {
              channel: `assistant_${window.eh.id}`,
              value: {
                response,
                threadId: refs.thread!.id,
                messages: messages.map((message) => ({
                  role: message.role,
                  content: message.content
                    .filter(
                      (c): c is Extract<OpenAI.Beta.Threads.Messages.MessageContent, { type: 'text' }> =>
                        c.type === 'text'
                    )
                    .map((c) => c.text.value)
                    .join('\n')
                }))
              }
            },
            meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
          })
          .finally(function () {
            return window.eh.sendEvent<CloseWindow>({
              name: 'CLOSE_WINDOW',
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          })
      }}
    >
      <Border style={{ flex: 1 }}>
        <TextButtonsLayout1>
          <FlexCenterDiv>
            <TextButton type='submit'>확인</TextButton>
            <TextButton
              type='button'
              onClick={function (e) {
                window.eh.sendEvent<CloseWindow>({
                  name: 'CLOSE_WINDOW',
                  meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                })
              }}
            >
              취소
            </TextButton>
          </FlexCenterDiv>
          <FlexCenterDiv>
            <TextButton
              type='button'
              disabled={!openai}
              onClick={async function (e) {
                if (!openai) return

                const messages: OpenAI.Beta.Threads.ThreadCreateParams.Message[] = []

                const thread = await openai.beta.threads.create({
                  messages
                })

                setMessages([])
                setInputMessages([])

                console.log('thread id: ', thread.id)
                refs.thread = thread
              }}
            >
              New Thread
            </TextButton>
            <TextButton
              type='button'
              disabled={!refs.thread}
              onClick={async function (e) {
                if (!refs.thread) return
                const revert = overlayLoader(e.currentTarget)

                const chosen = document.querySelector('input[type="radio"]:checked') as HTMLInputElement

                if (!chosen) return

                const dir = await window.eh
                  .sendEvent<OpenDialog>({
                    name: 'OPEN_DIALOG',
                    payload: { properties: ['createDirectory', 'promptToCreate', 'openDirectory'] },
                    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                  })
                  .then(function (value) {
                    return value.filePaths[0]
                  })

                await window.eh.sendEvent<WriteFile>({
                  name: 'WRITE_FILE',
                  payload: { file: `${dir}/${refs.thread.id}.json`, data: chosen.value, options: { flag: 'a+' } },
                  meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                })

                revert()
              }}
            >
              Save dataset
            </TextButton>
            <TextButton
              onClick={function (e) {
                ;(e.currentTarget.nextElementSibling as HTMLInputElement).click()
              }}
            >
              Attachment
            </TextButton>
            <Input
              id='attachment'
              style={{ display: 'none' }}
              type='file'
              accept='image/*'
              multiple
              onChange={function (e) {
                if (!openai || !e.currentTarget.files) return
                setFiles(Array.from(e.currentTarget.files))
              }}
            />
            <TextButton
              onClick={function (e) {
                ;(e.currentTarget.nextElementSibling as HTMLInputElement).click()
              }}
            >
              Finetuning
            </TextButton>
            <Input type='file' disabled multiple style={{ display: 'none' }} />
          </FlexCenterDiv>
        </TextButtonsLayout1>
        <DragBox>
          <AssistantNameLayout>
            {assistantInfo ? (
              <AssistantName title={assistantInfo.instructions || undefined}>{assistantInfo.name || ''}</AssistantName>
            ) : (
              <Loader />
            )}
          </AssistantNameLayout>
        </DragBox>
        <Outerlayout>
          <OutputLayout>
            <MessageContainer>
              {messages.map((m, index) =>
                m.role === 'assistant' ? (
                  <>
                    <AssistantMessage key={index} htmlFor={`message_${index}`}>
                      <TextMessage
                        spellCheck='false'
                        onDoubleClick={function (e) {
                          console.log('dbclicked')
                          e.currentTarget.contentEditable = 'true'
                        }}
                        onBlur={function (e) {
                          console.log('blurred')
                          e.currentTarget.contentEditable = 'false'
                          setMessages(
                            messages.with(index, {
                              ...m,
                              content: [
                                { type: 'text', text: { value: e.currentTarget.textContent || '', annotations: [] } }
                              ]
                            })
                          )
                        }}
                      >
                        {m.content
                          .filter(
                            (c): c is Extract<OpenAI.Beta.Threads.Messages.MessageContent, { type: 'text' }> =>
                              c.type === 'text'
                          )
                          .map((c) => c.text.value)
                          .join('\n')}
                      </TextMessage>
                    </AssistantMessage>
                    <Input
                      type='radio'
                      id={`message_${index}`}
                      name='message'
                      value={m.content
                        .filter(
                          (c): c is Extract<OpenAI.Beta.Threads.Messages.MessageContent, { type: 'text' }> =>
                            c.type === 'text'
                        )
                        .map((c) => c.text.value)
                        .join('\n')}
                    />
                  </>
                ) : (
                  <UserMessage key={index}>
                    <TextMessage>
                      {m.content
                        .filter(
                          (c): c is Extract<OpenAI.Beta.Threads.Messages.MessageContent, { type: 'text' }> =>
                            c.type === 'text'
                        )
                        .map((c) => c.text.value)
                        .join('\n')}
                    </TextMessage>
                  </UserMessage>
                )
              )}
              {inputMessages.map((m, index) => (
                <UserMessage key={index}>
                  <TextMessage>{m.content as string}</TextMessage>
                </UserMessage>
              ))}
            </MessageContainer>
          </OutputLayout>
          {/* <ContextLayout>
            {assistantInfo ? (
              <AssistantInstruction>{assistantInfo?.instructions || ''}</AssistantInstruction>
            ) : (
              <Loader />
            )}
          </ContextLayout> */}
          <InputLayout>
            <InputContainer>
              <TextArea
                id='assistant-input'
                value={textInput}
                onChange={function (e) {
                  setTextInput(e.currentTarget.value)
                }}
                disabled={!openai}
                spellCheck='false'
                onKeyDown={async function (e) {
                  if (!openai) return
                  if (e.key === 'Enter' && !e.shiftKey) {
                    const fileIds = await Promise.all(
                      files.map((file) => openai.files.create({ file, purpose: 'vision' }).then((r) => r.id))
                    )

                    setInputMessages([
                      ...inputMessages,
                      {
                        role: 'user',
                        content: textInput,
                        attachments: fileIds.map((fid) => ({ file_id: fid, tools: [{ type: 'file_search' }] }))
                      }
                    ])
                    setTextInput('')
                    setFiles([])
                  }
                }}
              />
              <ButtonContainer>
                <ExecuteButton
                  type='button'
                  disabled={threadLock || !refs.thread}
                  onClick={async function (e) {
                    console.log('refs: ', refs)
                    if (!openai || !refs.thread || !refs.assistantId) return
                    // const run = await createRun({
                    //   assistandId: refs.assistantId,
                    //   inputMessages,
                    //   model: refs.model,
                    //   threadId: refs.thread.id,
                    //   toolChoice: refs.toolChoice
                    // })

                    setThreadLock(true)

                    // const revert = overlayLoader(e.currentTarget)

                    const run = await openai.beta.threads.runs.createAndPoll(refs.thread.id, {
                      assistant_id: refs.assistantId,
                      additional_messages: inputMessages,
                      model: refs.model,
                      tool_choice: refs.toolChoice,
                      tools: refs.tools,
                      temperature: refs.temperature,
                      response_format: refs.responseFormat
                    })

                    console.log('input messages: ', inputMessages)

                    // revert()

                    if (run.last_error) {
                      // later show error messages
                      setThreadLock(false)
                      return console.error('run is failed: ', run)
                    }

                    if (
                      run.required_action &&
                      run.required_action.submit_tool_outputs &&
                      run.required_action.submit_tool_outputs.tool_calls
                    ) {
                      try {
                        await Promise.all(
                          run.required_action.submit_tool_outputs.tool_calls.map(function (call, i) {
                            if (!refs.toolBinding) throw new Error('NO_TOOL_BINDING')

                            const { pid, sid } = refs.toolBinding[call.function.name]

                            if (!pid) throw new Error(`NO_PROCEDURE_MATCHED_FROM_THE_TOOL_${call.function.name}`)

                            console.log(`call${i}: `, call)

                            return window.eh
                              .sendEvent<InitializeProcess>({
                                name: 'INITIALIZE_PROCESS',
                                payload: {
                                  pid,
                                  idr: Object.fromEntries(
                                    Object.entries(JSON.parse(call.function.arguments)).map(([key, value]) => [
                                      key,
                                      [[`$<json|parse|${JSON.stringify(value)}>`]]
                                    ])
                                  )
                                },
                                meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
                              })
                              .then(function ({ tidOrTree, scriptValues }) {
                                console.log('tid: ', tidOrTree)
                                console.log('script return values: ', scriptValues)
                                return scriptValues[tidOrTree as string][sid]
                              })
                          })
                        ).then(function (outputs) {
                          console.log('tool outputs: ', outputs)
                          return openai.beta.threads.runs.submitToolOutputsAndPoll(refs.thread!.id, run.id, {
                            tool_outputs: outputs.map((o, i) => ({
                              output: typeof o === 'string' ? o : JSON.stringify(o),
                              tool_call_id: run.required_action!.submit_tool_outputs!.tool_calls[i].id
                            }))
                          })
                        })
                      } catch (err: any) {
                        console.log('failed to resolve run: ', err)
                        await openai.beta.threads.runs.cancel(refs.thread.id, run.id)
                        setInputMessages([])
                        setThreadLock(false)
                        return
                      }
                    }

                    console.log('run: ', run.status, run.id)

                    const threadMessages = await openai.beta.threads.messages
                      .list(refs.thread.id, {
                        // run_id: run.id,
                        order: 'asc'
                      })
                      .then((res) => res.data)

                    console.log('messages from the run: ', threadMessages)

                    setMessages(threadMessages)

                    // if (run.required_action) {
                    //   /**
                    //    * call internal api or send event to main-world to evaluate the script that represents the function which is binded as a tool for the run
                    //    * current script is for interacting with the tree
                    //    * so It might be better to separate the evaluation from invoking effect
                    //    */

                    //   await openai.beta.threads.runs.submitToolOutputsAndPoll(refs.thread.id, run.id, {
                    //     // tool_outputs: [{ output: '{"success" : "true"}', tool_call_id: callId }]

                    //     tool_outputs: run.required_action.submit_tool_outputs.tool_calls.map((toolCall) => ({
                    //       output: '{"success" : "true"}',
                    //       tool_call_id: toolCall.id
                    //     }))
                    //   })
                    // }

                    setInputMessages([])
                    setThreadLock(false)
                  }}
                >
                  실행
                </ExecuteButton>
              </ButtonContainer>
            </InputContainer>
          </InputLayout>
        </Outerlayout>
      </Border>
    </Container>
  )
}

export default AssistantApp

const Container = styled(Form)`
  // -webkit-app-region: drag;

  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  padding: 4px;

  & > *:not(:first-child) {
    margin-top: 4px;
  }
`

const Outerlayout = styled(Div)`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-columns: 7fr 3fr;
  grid-template-rows: auto 100px;
  grid-template-areas:
    // 'output context'

    'output output'
    'input input';
  grid-gap: 6px;
`

const AligningContainer = styled(FlexColumnCenterDiv)`
  flex: 1;
`

const OutputLayout = styled(FlexDiv)`
  flex: 1;
  min-height: 0;
  grid-area: output;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
`

const ContextLayout = styled(FlexColumnDiv)`
  grid-area: context;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  min-width: 0;
  min-height: 0;
  overflow: hidden scroll;
  padding: 4px;

  ${SCROLL}
`

const UserMessage = styled(FlexDiv)`
  justify-content: flex-end;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: 6px;
  margin-left: 32px;
  text-align: right;
`

const AssistantMessage = styled(Label)`
  justify-content: flex-start;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: 6px;
  margin-right: 32px;
  text-align: left;
  cursor: pointer;

  & + input[type='radio'] {
    display: none;
  }
`

const MessageContainer = styled(FlexColumnDiv)`
  flex: 1;
  overflow: scroll;
  align-items: stretch;
  padding: 4px;

  & > * {
    margin-top: 4px;
  }

  ${SCROLL}

  &:has(${AssistantMessage} + input[type="radio"]:checked) > ${AssistantMessage} {
    border: 1px solid black;
  }
`

const TextMessage = styled.pre`
  overflow: hidden scroll;
  width: 400px;
  white-space: break-spaces;
  font-size: 12px;
  ${SCROLL}
`

const InputLayout = styled(FlexDiv)`
  grid-area: input;

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

const AssistantNameLayout = styled(FlexDiv)`
  height: 40px;
  font-size: 16px;
  align-items: center;
  font-style: italic;
`

const AssistantName = styled(Span)`
  padding: 4px;
`

const AssistantInstruction = styled(Span)`
  font-size: 12px;
`

const ExecuteButton = styled(TextButton)``

const DragBox = styled(FlexColumnDiv)`
  -webkit-app-region: drag;
`
