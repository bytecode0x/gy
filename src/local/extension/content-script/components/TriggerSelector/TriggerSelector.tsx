import { FlexColumnDiv, TextButton } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'
import { FC, useRef } from 'react'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)`
  width: 250px;
  height: 200px;

  background-color: white;
  box-shadow: var(--shadow-elevation4);
  border-radius: var(--border-radius-default);
  padding: 8px;
`

/**
 * this is for scroll
 * scroll bar causes border-radius to 0
 */
const InnerContainer = styled(FlexColumnDiv)`
  flex: 1;
  overflow: hidden scroll;
  ${SCROLL}
`

const Item = styled(TextButton)``

type TriggerTemplateSelectorProps = {
  onSelect: (template: TriggerPreset['template']) => any
}

const TriggerTemplateSelector: FC<TriggerTemplateSelectorProps> = ({ onSelect }) => {
  const templates = useRef<Array<TriggerPreset['template']>>(['DATE_TIME', 'CONTEXT_BUTTON']).current

  return (
    <Container>
      <InnerContainer>
        {templates.map((template, index) => (
          <Item
            key={template}
            onClick={function (e) {
              onSelect(template)
            }}
          >
            {template}
          </Item>
        ))}
      </InnerContainer>
    </Container>
  )
}

export default TriggerTemplateSelector
