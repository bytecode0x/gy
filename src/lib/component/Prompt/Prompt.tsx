import { FlexColumnDiv, FlexDiv, Form, Span, TextArea, TextButton } from 'lib/frame/generic'
import { FC, useState } from 'react'
import styled from 'styled-components'

type PromptProps = {
  header: string
  // label: string
  defaultValue?: string
  placeholder?: string
  onResolve: (input: string) => any
  onReject: (reason: string) => any
}

const Prompt: FC<PromptProps> = ({ header, placeholder, defaultValue, onResolve, onReject }) => {
  const [value, setValue] = useState<string>(defaultValue || '')
  // const id = v4()

  return (
    <Container
      onSubmit={function (e) {
        e.preventDefault()

        onResolve(value)
      }}
    >
      <Border>
        <Header>{header}</Header>
        {/* <Label htmlFor={id}>{label}</Label> */}
        <ButtonsLayout>
          <TextButton type='submit' disabled={!value}>
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
        </ButtonsLayout>
        <TextAreaLayout>
          <TextArea
            autoFocus
            spellCheck={false}
            // id={id}
            // name={id}
            // defaultValue={defaultValue}
            placeholder={placeholder || '값을 입력하세요'}
            onChange={(e) => setValue(e.target.value)}
            value={value}
          />
        </TextAreaLayout>
      </Border>
    </Container>
  )
}

export default Prompt

const Container = styled(Form)`
  //   width: 100%;
  //   height: 100%;
  width: 600px;
  height: 400px;
  padding: var(--padding-default, 8px);
  display: flex;
  flex-direction: column;
  background-color: white;
  font-size: 12px;

  & textarea {
    flex: 1;
    border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  }

  & textarea::placeholder {
    font-size: 28px;
    font-style: italic;
  }
`
const Border = styled(FlexColumnDiv)`
  flex: 1;
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
  padding: var(--padding-default, 8px);

  & > * {
    margin: 6px 0;
  }
`

const Header = styled(Span)`
  font-size: 14px;
`

const ButtonsLayout = styled(FlexDiv)`
  font-size: 12px;
  & > button {
    border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
    padding: 6px;
    margin-right: 4px;
    box-shadow: var(--shadow-elevation);
  }
`

const TextAreaLayout = styled(FlexColumnDiv)`
  flex: 1;
`
