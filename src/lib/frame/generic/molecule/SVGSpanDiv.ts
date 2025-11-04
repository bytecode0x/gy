import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { NO_SELECT } from '../../../styled-css-property'
import { Div, Span } from '../atom'

type Props = {
  direction?: 'row' | 'column'
  svgSize?: string
}

export const SVGSpanDiv = styled(Div)<Props>`
  display: flex;
  flex-direction: ${({ direction }) => direction || 'row'};
  position: relative;
  align-items: center;
  // background-color: var(--color-bg-primary);
  color: var(--color-text-primary);

  ${NO_SELECT}

  & > ${Span} {
    display: flex;
    flex: 1;
    // set font size on custom
  }

  & > svg {
    width: var(--svg-size-default);
    height: var(--svg-size-default);
    // margin-right: 0.75rem;
    // set margin on custom
  }
  ${({ css }) => kebabizeCSSObject(css)}
`

export default SVGSpanDiv
