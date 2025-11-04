import Plus from 'lib/asset/svg/Plus'
import { SVGButton } from 'lib/frame/generic'
import styled from 'styled-components'

const Container = styled(SVGButton)`
  border-radius: 100%;
  background-color: violet;
  color: white;
  padding: 16px;

  & > svg {
    width: 30px;
    height: 30px;
  }
`

const BuildTask = () => {
  return (
    <Container>
      <Plus />
    </Container>
  )
}

export default BuildTask
