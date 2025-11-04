import { Button, FlexCenterDiv, Form, Input, Label } from 'lib/frame/generic'
import { __Trigger__DateTime } from 'local/desktop/main/gy/type/trigger.preset'
import React from 'react'
import styled from 'styled-components'

const Container = styled(Form)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 300px;
  min-height: 450px;
  border-radius: var(--border-radius-default, 8px);
  background-color: white;
  padding: 16px;
`

const Row = styled(FlexCenterDiv)`
  & + & {
    margin-top: 16px;
  }
`

const Submit = styled(Button)`
  padding: 8px;
`

type DateTimeProps = {
  resolve?: (value: __Trigger__DateTime['value']) => void
}

const TriggerDateTimeForm: React.FC<DateTimeProps> = ({ resolve }) => {
  return (
    <Container
      onSubmit={function (e) {
        e.preventDefault()
        // @ts-ignore
        const formData = new FormData(e.currentTarget)
        if (resolve)
          resolve(
            Object.fromEntries(
              Array.from(formData.entries()).map(([key, value]) => [key, value.toString()])
            ) as __Trigger__DateTime['value']
          )
      }}
    >
      <Row>
        <Label htmlFor='second'>초</Label>
        <Input name='second' type='number' />
      </Row>
      <Row>
        <Label htmlFor='minute'>분</Label>
        <Input name='minute' type='number' />
      </Row>
      <Row>
        <Label htmlFor='hour'>시</Label>
        <Input name='hour' type='number' />
      </Row>
      <Row>
        <Label htmlFor='date'>일</Label>
        <Input name='date' type='number' />
      </Row>
      <Row>
        <Label htmlFor='month'>월</Label>
        <Input name='month' type='number' />
      </Row>
      <Row>
        <Label htmlFor='year'>년</Label>
        <Input name='year' type='number' />
      </Row>
      <Row>
        <Label htmlFor='dayOfWeek'>요일</Label>
        <Input name='dayOfWeek' type='number' />
      </Row>
      <Row>
        <Label htmlFor='tz'>시간대</Label>
        <Input name='tz' type='number' />
      </Row>
      <Submit type='submit'>확인</Submit>
    </Container>
  )
}

export default TriggerDateTimeForm
