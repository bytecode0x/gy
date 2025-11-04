import Toggler from 'lib/component/Toggler'
import { FlexColumnDiv, FlexDiv, Span } from 'lib/frame/generic'
import { FC, PropsWithChildren, useCallback, useState } from 'react'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  border-radius: var(--border-radius-default, 4px);
  box-shadow: var(--shadow-elevation, 0 1px 2px rgba(0, 0, 0, 0.15));
  background-color: white;

  justify-content: center;
  align-items: stretch;

  padding: 4px 12px;

  & + & {
    // border-top: 1px solid var(--color-border-cell);
    margin-top: 6px;
  }
`

const LabelSwitchLayout = styled(FlexDiv)`
  align-items: center;
  justify-content: space-between;
`

const ExpandingLayout = styled(FlexDiv)``

const Property = styled(Span)`
  font-size: 1.15em;
`

type Props = {
  label: string
  defaultChecked?: boolean
  onChange?: (v: boolean) => any
}

const GenericToggler: FC<PropsWithChildren<Props>> = ({ children, label, defaultChecked, onChange }) => {
  const [flag, setFlag] = useState<boolean>(!!defaultChecked)

  const handleChange = useCallback(
    function (v: boolean) {
      setFlag(v)
      if (onChange) onChange(v)
    },
    [onChange, setFlag]
  )

  return (
    <Container>
      <LabelSwitchLayout>
        <Property>{label}</Property>
        <Toggler onChange={handleChange} defaultChecked={defaultChecked} />
      </LabelSwitchLayout>
      <ExpandingLayout>{flag && children}</ExpandingLayout>
    </Container>
  )
}

export default GenericToggler
