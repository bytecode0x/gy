import { FlexColumnDiv, Span } from 'lib/frame/generic'
import { SCROLL } from 'lib/styled-css-property'
import { FC } from 'react'
import styled from 'styled-components'

const Container = styled(FlexColumnDiv)<{ width?: number; height?: number }>`
  width: ${({ width }) => width || 200}px;
  height: ${({ height }) => height || 400}px;
  box-shadow: var(--shadow-elevation4, 0px 2px 4px rgba(0, 0, 0, 0.6));
  border-radius: var(--border-radius-default, 8px);
  padding: var(--padding-default, 8px);
  display: flex;
  flex-direction: column;
  background-color: white;
  font-size: 12px;
  min-height: 0;
`

const Header = styled(Span)`
  font-size: 16px;
  font-weight: bold;
  font-style: italic;
  padding: 6px;
`

const Content = styled(FlexColumnDiv)`
  border: 1px solid rgba(0, 0, 0, 0.1);
  min-width: 0;
  min-height: 0;
  overflow: scroll;
  ${SCROLL}
`
type PaperBoxProps = {
  header: string
  content: any
  width?: number
  height?: number
}

const PaperBox: FC<PaperBoxProps> = ({ header, content, width, height }) => {
  return (
    <Container width={width} height={height}>
      <Header>{header}</Header>
      <Content>{content}</Content>
    </Container>
  )
}

export default PaperBox
