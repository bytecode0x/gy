import { FlexColumnDiv, TextButton } from 'lib/frame/generic'
import { InitialActionSchema } from 'lib/gy/core/type/action'
import { SCROLL } from 'lib/styled-css-property'
import { ActionPreset } from 'local/desktop/main/gy/type/action.preset'
import { actionInput } from 'local/extension/content-script/action-input'
import { FC } from 'react'
import styled from 'styled-components'
import { v4 } from 'uuid'

const Container = styled(FlexColumnDiv)`
  flex: 0 1;
  width: 300px;
  height: 70vh;
  min-width: 400px;
  min-height: 400px;
  max-height: 75vh;

  background-color: white;
  box-shadow: var(--shadow-elevation4);
  border-radius: var(--border-radius-default);
  padding: 8px;
`

const InnerContainer = styled(FlexColumnDiv)`
  flex: 1;
  overflow: hidden scroll;
  ${SCROLL}
`

const Item = styled(TextButton)`
  & + & {
    margin-top: 4px;
  }
`

type ActionSelectorProps = {
  onClick: (action: InitialActionSchema<ActionPreset>) => void
}

const ActionSelector: FC<ActionSelectorProps> = ({ onClick }) => {
  return (
    <Container>
      <InnerContainer>
        {Object.keys(actionInput).map((template, index) => (
          <Item
            key={template}
            onClick={async function (e) {
              onClick({
                template: template as ActionPreset['template'],
                id: v4(),
                name: '',
                spread: {},
                scope: {},
                snapshot: {}
                // value: {}
              })
            }}
          >
            {template}
          </Item>
        ))}
      </InnerContainer>
    </Container>
  )
}

export default ActionSelector
