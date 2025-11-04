import Dot from 'lib/asset/svg/Dot'
import HorizontalLine from 'lib/asset/svg/HorizontalLine'
import TriangleRightWay from 'lib/asset/svg/TriangleRightWay'
import { FlexCenterDiv } from 'lib/frame/generic'
import styled from 'styled-components'

const Container = styled(FlexCenterDiv)`
  display: grid;
  grid-template: 'start mid end';
  margin-left: -6px;
  z-index: 1;

  & > svg {
    height: 24px;
  }

  & > svg:nth-child(1) {
    width: 12px;
    grid-area: start;
  }

  & > svg:nth-child(2) {
    width: 72px;
    grid-area: mid;
  }

  & > svg:nth-child(3) {
    width: 12px;
    grid-area: end;
  }
`

const FlowArrow = () => {
  return (
    <Container>
      <Dot />
      <HorizontalLine />
      <TriangleRightWay />
    </Container>
  )
}

export default FlowArrow
