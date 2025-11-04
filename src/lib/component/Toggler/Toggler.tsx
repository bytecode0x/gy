import { FlexDiv, Input, Label } from 'lib/frame/generic'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

const Container = styled(Label)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
`

const HiddenCheckbox = styled(Input).attrs({ type: 'checkbox' })`
  display: none;
`

const StyledSwitch = styled(FlexDiv)<{
  $checked: boolean
  $disabled?: boolean
  sizeLevel?: number
}>`
  align-items: center;
  position: relative;

  --h: ${({ sizeLevel }) => sizeLevel || 25}px;
  --w: calc(var(--h) * 16 / 9);

  width: var(--w);
  height: var(--h);
  border-radius: 9999px;

  background-color: ${({ $checked }) => ($checked ? '#22c55e' : '#e5e7eb')};
  transition: background-color 0.25s ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

  &::before {
    content: '';
    // position: absolute;
    position: relative;

    --pad: calc(var(--h) * (1 - 0.85) / 2);
    --d: calc(var(--h) * 0.85);
    // top: var(--pad);
    // left: var(--pad);

    width: var(--d);
    height: var(--d);
    border-radius: 50%;

    background: white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    transition: transform 0.25s ease;

    transform: ${({ $checked }) =>
      $checked ? 'translateX(calc(var(--w) - var(--d) - var(--pad) * 2 + var(--pad)))' : 'translateX(var(--pad))'};
  }

  ${Container}:focus-within & {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.35);
  }
`

type ToggleSwitchProps = {
  defaultChecked?: boolean
  disabled?: boolean
  sizeLevel?: number
  onChange?: (checked: boolean) => void
}

const Toggler: React.FC<ToggleSwitchProps> = ({ defaultChecked, disabled, sizeLevel, onChange }) => {
  const [flag, setFlag] = useState<boolean>(!!defaultChecked)

  const handleChange = useCallback(
    function (e: React.ChangeEvent<HTMLInputElement>) {
      const next = !flag
      onChange?.(next)
      setFlag(next)
    },
    [flag]
  )

  return (
    <Container>
      <HiddenCheckbox checked={flag} onChange={handleChange} disabled={disabled} />
      <StyledSwitch $checked={!!flag} $disabled={disabled} sizeLevel={sizeLevel} />
    </Container>
  )
}

export default Toggler
