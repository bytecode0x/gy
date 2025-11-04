import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { FLEX_CENTER, HOVER_BGC_OFFSET, HOVER_COLOR_OFFSET } from '../../../styled-css-property'
import { Button } from '../atom'

type CSSProps = {
  svgSize?: string
}

export const SVGButton = styled(Button)<CSSProps>`
  ${FLEX_CENTER}
  border-radius: var(--border-radius-default);
  background-color: transparent;
  position: relative;
  padding: var(--padding-default);

  ${HOVER_BGC_OFFSET}
  ${HOVER_COLOR_OFFSET}
  
  & > svg {
    width: ${({ svgSize }) => svgSize || `var(--svg-size-nav)`};
    height: ${({ svgSize }) => svgSize || `var(--svg-size-nav)`};
    color: var(--color-text-primary);
  }
  ${({ css }) => kebabizeCSSObject(css)}
`

export default SVGButton
