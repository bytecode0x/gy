import { FlexCenterDiv, FlexColumnDiv, Form, Input, Span, TextButton } from 'lib/frame/generic'
import { FC, useRef, useState } from 'react'
import styled from 'styled-components'

const Container = styled(Form)`
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-default, 8px);
  background-color: white;
  padding: var(--padding-default, 8px);
  box-shadow: var(--shadow-elevation4);
  min-width: 0;
  width: 300px;
  height: 120px;
`

const StatusLayout = styled(FlexCenterDiv)`
  justify-content: space-between;
  //   margin: 6px 4px;
  padding: 4px;
`

const ButtonsContainer = styled(FlexCenterDiv)`
  font-size: 12px;

  & > button:first-of-type {
    margin-right: 4px;
  }

  & button {
    border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
    padding: 6px;
    margin-right: 4px;
    box-shadow: var(--shadow-elevation);
  }
`

const NameInput = styled(Input)`
  border: 1px solid var(--color-border-base, rgba(0, 0, 0, 0.1));
`

const Status = styled(Span)<{ validated?: boolean }>`
  background-color: ${({ validated }) => (validated === undefined ? 'grey' : validated ? 'green' : 'red')};
  position: relative;
  font-size: 12px;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  margin-right: 4px;
`

const InputLayer = styled(FlexColumnDiv)`
  flex: 1;
  align-items: stretch;
  min-height: 0;
  padding: 4px;
`

const Title = styled(Span)`
  font-size 14px;
`

const TitleLayer = styled(FlexColumnDiv)`
  padding: 4px;
`

type SubstituteNameInputProps = {
  title?: string
  initial?: string
  placeholder?: string
  substitutes: Array<string>
  onResolve: (name: string) => void
  onReject: (reason?: any) => void
}

const SubstituteNameInput: FC<SubstituteNameInputProps> = ({
  initial,
  title,
  substitutes,
  placeholder,
  onResolve,
  onReject
}) => {
  const [name, setName] = useState<string>(initial || '')
  const [validated, setValidated] = useState<boolean | undefined>(undefined)

  const pSubstituteName = useRef<RegExp>(
    /^[A-Za-z_\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][\s0-9A-Za-z_$\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]*$/
  ).current

  return (
    <Container
      onSubmit={function (e) {
        e.preventDefault()

        onResolve(name)
      }}
    >
      <TitleLayer>
        <Title>{title || 'input substitute name'}</Title>
      </TitleLayer>
      <StatusLayout>
        <ButtonsContainer>
          <TextButton type='submit' disabled={!name || !validated}>
            <Span>확인</Span>
          </TextButton>
          <TextButton
            type='button'
            onClick={function (e) {
              onReject('user canceled')
            }}
          >
            <Span>취소</Span>
          </TextButton>
        </ButtonsContainer>
        <FlexCenterDiv>
          <Status
            validated={validated}
            data-desc={
              substitutes.includes(name)
                ? 'substitute name can not be duplicated'
                : validated
                ? 'validated'
                : 'non-validated'
            }
          />
        </FlexCenterDiv>
      </StatusLayout>
      <InputLayer>
        <NameInput
          autoFocus
          value={name}
          // type='text'
          maxLength={50}
          placeholder={placeholder || '이 값은 대입(substitution)과정에 쓰입니다'}
          onChange={function (e) {
            setName(e.target.value)
            setValidated(pSubstituteName.test(e.target.value) && !substitutes.includes(e.target.value))
          }}
        />
      </InputLayer>
    </Container>
  )
}

export default SubstituteNameInput
