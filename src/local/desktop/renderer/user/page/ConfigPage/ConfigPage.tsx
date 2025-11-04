import { FlexColumnDiv, Span } from 'lib/frame/generic'
import styled from 'styled-components'
import GenericToggler from '../../component/GenericToggler'

const Container = styled(FlexColumnDiv)``

const OptionContainer = styled(FlexColumnDiv)`
  align-items: stretch;
`

const ConfigPage = () => {
  return (
    <Container>
      <OptionContainer>
        <GenericToggler
          label='toggler1'
          onChange={function (v) {
            console.log('toggle value change: ', v)
          }}
          defaultChecked
        >
          <Span>expanding here</Span>
        </GenericToggler>

        <GenericToggler
          label='toggler2'
          onChange={function (v) {
            console.log('toggle value2 change: ', v)
          }}
        >
          <Span>expanding here2</Span>
        </GenericToggler>
      </OptionContainer>
    </Container>
  )
}

export default ConfigPage
