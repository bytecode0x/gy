import { FlexColumnDiv, TextButton } from 'lib/frame/generic'
import { forwardRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  position: relative;
  min-width: 200px;
  background-color: white;
  align-items: stretch;
  padding: 5px 10px;
  overflow: hidden;
  // z-index: 1;

  border-right: 1px solid var(--color-border-base);

  & > button {
    // font-family: fantasy;
    font-size: 20px;
    height: 50px;
    // color: var(--text-color-default);
    border-radius: 8px;
  }

  & > button[disabled] {
    color: var(--text-color--disabled);
  }
`
const NavigationButton = styled(TextButton)``

// eslint-disable-next-line no-empty-pattern
const Navigator = forwardRef<HTMLDivElement>(({}, ref) => {
  const navigate = useNavigate()

  const toProcedure = useCallback(function () {
    navigate('/procedure')
  }, [])

  const toScript = useCallback(function () {
    navigate('/script')
  }, [])

  const toTrigger = useCallback(function () {
    navigate('/trigger')
  }, [])

  const toConfiguration = useCallback(function () {
    navigate('/configuration')
  }, [])

  return (
    <Container id='nav' ref={ref}>
      {/* <NavigationButton onClick={toTrigger}>Trigger</NavigationButton> */}

      <NavigationButton onClick={toProcedure}>Procedure</NavigationButton>

      <NavigationButton onClick={toScript}>Script</NavigationButton>

      <NavigationButton onClick={toConfiguration}>Configuration</NavigationButton>
    </Container>
  )
})

export default Navigator
