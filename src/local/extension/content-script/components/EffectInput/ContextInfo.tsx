import { FlexColumnDiv, Span, TextButton } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import { FC } from 'react'
import styled from 'styled-components'

import { ZodType } from 'zod'
// import 'prismjs/components/prism-javascript'
// you need to append it to styled component global style manually
// import 'prismjs/themes/prism.css'

const Header = styled(Span)`
  font-size: 16px;
  font-weight: bold;
  // font-style: italic;
`

const Container = styled(FlexColumnDiv)`
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

const ReturnType = styled(Span)`
  font-size: 12px;
  // font-weight: bold;
  font-style: italic;
`
type ContextInfoProps = {
  parameters?: Array<{ id: string; type: string; snapshot: any }>
  global?: Array<{ id: string; type: string; snapshot: any }>
  returnType: { label: string; scheme: ZodType }
  onClick?: (snapshot: any) => void
}

const ContextInfo: FC<ContextInfoProps> = ({ returnType, global = [], onClick, parameters = [] }) => {
  return (
    <Container>
      <ParametersLayout>
        <Header>Parameters</Header>
        {parameters.map(({ id, type, snapshot }) => (
          <Parameter key={id}>
            <TextButton
              type='button'
              data-desc='테스트에 쓰이는 스냅샷을 출력합니다'
              onClick={function () {
                if (onClick) onClick(snapshot)
              }}
            >
              {id}
            </TextButton>
            <Span>{type}</Span>
          </Parameter>
        ))}
      </ParametersLayout>
      <ParametersLayout>
        <Header>Global</Header>
        {global.map(({ id, type, snapshot }) => (
          <Parameter key={id}>
            <TextButton
              data-desc='테스트에 쓰이는 스냅샷을 출력합니다'
              onClick={function () {
                if (onClick) onClick(snapshot)
              }}
            >
              {id}
            </TextButton>
            <Span>{type}</Span>
          </Parameter>
        ))}
      </ParametersLayout>

      <ReturnTypeLayout>
        <Header>Return type</Header>
        <ReturnType>{returnType.label}</ReturnType>
      </ReturnTypeLayout>
    </Container>
  )
}

export default ContextInfo
