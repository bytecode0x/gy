import { FlexCenterDiv, FlexColumnDiv, FlexDiv, Input, Span, TextButton } from 'lib/frame/generic'
import { DialogCenter, EllipticalLabel } from 'lib/frame/sementic'
import { SCROLL } from 'lib/styled-css-property'
import { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
// import 'prismjs/components/prism-clike'
// import 'prismjs/components/prism-javascript'
// you need to append it to styled component global style manually
// import 'prismjs/themes/prism.css'

type FormSchema = {
  data?: any
  help?: string
  // this should be dealt in upper layer
  // required?: boolean
  modifiable?: boolean
  secret?: boolean
  labeler?: (value: string) => string
  // input?: (getter: () => string | undefined, setter: (value: string) => void, close: () => void) => ReactNode
  modal?: (getter: () => any, setter: (value: any) => void, close: () => void) => ReactNode
  effect?: (getter: () => any, setter: (value: any) => void, remove: () => void) => void
}

type FormRecord = {
  [key: string]: FormSchema
}

type FormProps = {
  header: string
  width?: number
  height?: number
  record: Record<string, FormSchema | null>
  configurable?: boolean
  defaultSchema?: (key: string) => FormSchema
  onRecordKeyChange?: (prev: string, curr: string) => void
  onPreflight?: (formData: Record<string, any>) => Promise<boolean>
  onResolve: (formData: Record<string, any>) => any
  onReject: (reason: string) => any
}

function setter(key: string): FormSchema {
  return {
    data: '',
    labeler(value) {
      return '클릭하여 값을 설정하세요'
    },
    effect(getter, setter) {
      setter(window.prompt(`${key} 값을 입력하세요`, '') || '')
    },
    modifiable: true
  }
}

const Form: FC<FormProps> = ({
  record,
  header,
  width,
  height,
  configurable,
  defaultSchema = setter,
  onRecordKeyChange,
  onPreflight,
  onReject,
  onResolve
}) => {
  const [formRecord, setFormRecord] = useState<FormRecord>(
    Object.fromEntries(Object.entries(record).map(([key, value]) => [key, { ...defaultSchema(key), ...value }]))
  )
  const [inputFlag, setInputFlag] = useState<boolean>(false)

  const blurOnEnter: React.KeyboardEventHandler<HTMLElement> = useCallback(function (e) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }, [])

  const changeName = useCallback(
    function (label: string): React.FocusEventHandler<HTMLElement> {
      return function (e) {
        const changed = e.target.textContent
        // console.log(`label ${label} blur invoked; changed to : `, changed)
        if (!changed) {
          delete formRecord[label]
          return setFormRecord({ ...formRecord })
        }
        formRecord[changed] = { ...formRecord[label] }
        delete formRecord[label]
        setFormRecord({ ...formRecord })
        if (onRecordKeyChange) onRecordKeyChange(label, changed)
      }
    },
    [formRecord]
  )

  const addRecord: React.FocusEventHandler<HTMLInputElement> = useCallback(
    function (e) {
      if (!configurable || !defaultSchema) return
      const label = e.target.value
      e.target.value = ''
      if (!label) return setInputFlag(false)
      formRecord[label] = defaultSchema(label)

      setFormRecord({ ...formRecord })
      return setInputFlag(false)
    },
    [formRecord]
  )

  // const newLabel = useRef<HTMLElement>(null)

  useEffect(
    function log() {
      console.log(`form record: `, formRecord)
    },
    [formRecord]
  )

  return (
    <Container width={width} height={height}>
      <Border>
        <Header>{header}</Header>

        <ButtonsLayout>
          <FlexCenterDiv>
            <TextButton
              type='button'
              // disabled={Object.keys(formData).some((key) => formData[key])}
              onClick={function () {
                onResolve(Object.fromEntries(Object.keys(formRecord).map((key) => [key, formRecord[key].data])))
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
            {configurable && (
              <TextButton
                type='button'
                onClick={function () {
                  setInputFlag(true)
                }}
              >
                추가
              </TextButton>
            )}
            {onPreflight && (
              <TextButton
                type='button'
                // data-desc='서버로 요청을 보내 응답 코드를 받아봅니다'
                // disabled={!code}
                onClick={function () {
                  console.log(
                    'preflight : ',
                    onPreflight(
                      Object.fromEntries(
                        onResolve(Object.fromEntries(Object.keys(formRecord).map((key) => [key, formRecord[key].data])))
                      )
                    )
                  )
                }}
              >
                테스트
              </TextButton>
            )}
          </FlexCenterDiv>
        </ButtonsLayout>
        <OuterLayout>
          <OptionsLayout>
            {Object.entries(formRecord).map(function ([label, { data, effect, modal, modifiable, secret }], index) {
              const getter = function () {
                return formRecord[label].data
              }

              const setter = function (value: string) {
                setFormRecord((prev) => ({ ...prev, [label]: { ...formRecord[label], data: value } }))
              }

              const remove = function () {
                setFormRecord(function (prev) {
                  const curr = { ...prev }
                  delete curr[label]
                  return curr
                })
              }

              let dialog: HTMLDialogElement
              const close = function () {
                if (!dialog) return

                dialog.close()
              }

              return (
                <OptionContainer key={index}>
                  <FormRecordKey
                    title={label}
                    modifiable={modifiable}
                    contentEditable={modifiable}
                    spellCheck={false}
                    autoCorrect='false'
                    suppressContentEditableWarning
                    onKeyDown={modifiable ? blurOnEnter : undefined}
                    onBlur={modifiable ? changeName(label) : undefined}
                  >
                    {label}
                  </FormRecordKey>
                  {modal && (
                    <DialogCenter
                      ref={function (_) {
                        if (!_) return
                        dialog = _
                      }}
                      id={`dialog_${index}`}
                    >
                      {modal(getter, setter, close)}
                    </DialogCenter>
                  )}
                  <TextButton
                    onClick={function (e) {
                      const dialog = e.currentTarget.previousElementSibling

                      if (!dialog && !effect) {
                        const { effect } = defaultSchema(label)
                        if (effect) return effect(getter, setter, remove)
                      }

                      if (dialog && dialog instanceof HTMLDialogElement) dialog.showModal()

                      if (effect) effect(getter, setter, remove)
                    }}
                  >
                    <FormRecordKey
                      title={
                        formRecord[label].data !== undefined
                          ? secret
                            ? undefined
                            : formRecord[label].labeler
                            ? formRecord[label].labeler!(formRecord[label].data!)
                            : JSON.stringify(formRecord[label].data)
                          : formRecord[label].help || '값을 입력하려면 클릭하세요'
                      }
                    >
                      {formRecord[label].data !== undefined
                        ? secret
                          ? '****'
                          : formRecord[label].labeler
                          ? formRecord[label].labeler!(formRecord[label].data!)
                          : JSON.stringify(formRecord[label].data)
                        : formRecord[label].help || '값을 입력하려면 클릭하세요'}
                    </FormRecordKey>
                  </TextButton>
                </OptionContainer>
              )
            })}
            {inputFlag && (
              <OptionContainer>
                <LabelInput autoFocus onKeyDown={blurOnEnter} onBlur={addRecord}>
                  {/* test */}
                </LabelInput>
                <FlexDiv css={{ flex: 1 }} />
              </OptionContainer>
            )}
          </OptionsLayout>
        </OuterLayout>
      </Border>
    </Container>
  )
}

export default Form

const Container = styled(FlexColumnDiv)<{ width?: number; height?: number }>`
  width: ${({ width }) => width || 400}px;
  height: ${({ height }) => height || 300}px;
  padding: var(--padding-default, 8px);
  background-color: white;
  font-size: 12px;
  box-shadow: var(--shadow-elevation4);
  border-radius: var(--border-radius-default, 8px);

  & textarea::placeholder {
    font-size: 28px;
    font-style: italic;
  }
`
const Border = styled(FlexColumnDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  min-height: 0;
`

const ButtonsLayout = styled(FlexDiv)`
  justify-content: space-between;
  font-size: 12px;
  margin: 6px 0;

  & button {
    border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
    padding: 6px;
    margin-right: 4px;
    box-shadow: var(--shadow-elevation);
  }
`

const Header = styled(Span)`
  font-size: 16px;
  font-weight: bold;
  // font-style: italic;
  margin: 6px 0;
  word-break: auto-phrase;
`

const OuterLayout = styled(FlexDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
  margin: 6px 0 0 0;
`

const OptionsLayout = styled(FlexColumnDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);
  font-size: 12px;

  overflow: hidden scroll;
  ${SCROLL}
`

const OptionContainer = styled(FlexDiv)`
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: 6px;
  }

  & > * {
    flex: 1;
    min-width: 0;
  }
`

const FormRecordKey = styled(EllipticalLabel)<{ modifiable?: boolean }>`
  flex: 1;
  font-style: italic;

  ${({ modifiable }) => modifiable && 'cursor : text;'}

  &:empty {
    border-bottom: 1px solid black;
  }
`

const LabelInput = styled(Input)`
  flex: 1;

  &:empty {
    border-bottom: 1px solid black;
  }
`
