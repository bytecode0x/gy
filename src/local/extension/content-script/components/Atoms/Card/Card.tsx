import { FlexColumnDiv, FlexDiv, Input } from 'lib/frame/generic'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  min-width: 200px;
  min-height: 200px;
  border-radius: var(--border-radius-default);
  box-shadow: var(--shadow-elevation4);
  background-color: var(--color-bg-primary);
`

const Header = styled(Input)`
  height: 40px;
  font-size: 18px;
  border-bottom: 1px solid var(--color-border-base);
`

const Body = styled(FlexDiv)`
  font-size: 16px;
`
const Descriptive = styled(FlexDiv)``

const Variable = styled(FlexDiv)``

const Value = styled(FlexDiv)``

export type CardProps = {
  header: string
  placeholder?: string
  onHeaderChange?: (header: string) => any
}

const Card: React.FC<React.PropsWithChildren<CardProps>> = ({ header, placeholder, onHeaderChange, children }) => {
  const [value, setValue] = useState<string>(header)

  const invokeEffect: React.FocusEventHandler<HTMLInputElement> = useCallback(function (e) {
    const _header = e.currentTarget.textContent || ''
    if (onHeaderChange) onHeaderChange(_header)
    setValue(_header)
  }, [])

  return (
    <Container>
      <Header disabled={!onHeaderChange} placeholder={placeholder} onBlur={invokeEffect} value={value} />
      <Body>{children}</Body>
    </Container>
  )
}

export default Card
