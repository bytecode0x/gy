import { Button, Datalist, FlexCenterDiv, Form, Input, Label, Option } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import React, { useRef } from 'react'
import styled from 'styled-components'

const Container = styled(Form)`
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: var(--border-radius-default, 8px);
  min-width: 200px;
  min-height: 300px;
  overflow: scroll;
  ${SCROLL}
`

const Row = styled(FlexCenterDiv)``

const Submit = styled(Button)`
  display: none;
`

type TaskRequirementProps = {
  reqKeys: Array<string>
  list: Array<string>
  onSubmit: (map: Record<string, string>) => void
}

const TaskRequirement: React.FC<TaskRequirementProps> = ({ reqKeys, list, onSubmit }) => {
  const submitButton = useRef<HTMLButtonElement>(null)

  return (
    <Container
      onSubmit={function (e) {
        e.preventDefault()
        // @ts-ignore
        const formData = new FormData(e.currentTarget)
        onSubmit(Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, value.toString()])))
      }}
      onBlur={function () {
        submitButton.current?.click()
      }}
    >
      {reqKeys.map((key) => (
        <Row key={key}>
          <Label>{key}</Label>
          <Input type='text' list='req-list' />
          <Datalist id='req-list'>
            {list.map((item) => (
              <Option key={item}>{item}</Option>
            ))}
          </Datalist>
        </Row>
      ))}
      <Submit type='submit' ref={submitButton} />
    </Container>
  )
}

export default TaskRequirement
