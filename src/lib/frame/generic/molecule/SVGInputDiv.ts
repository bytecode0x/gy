import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import FlexDiv from './FlexDiv'

export const SVGInputDiv = styled(FlexDiv)`
  & > svg {
    width: var(--svg-size-default);
    height: var(--svg-size-default);
    color: inherit;
  }

  &:focus {
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-focusin);
  }
  ${({ css }) => kebabizeCSSObject(css)}
`
export default SVGInputDiv
