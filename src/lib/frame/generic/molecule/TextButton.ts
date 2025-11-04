import { kebabizeCSSObject } from 'lib/util/string'
import styled from 'styled-components'
import { HOVER_COLOR_OFFSET } from '../../../styled-css-property'
import { Button } from '../atom'

export const TextButton = styled(Button)`
  display: flex;
  justify-content: center;
  align-items: center;
  // margin: var(--margin-small) var(--margin-default);
  border-radius: var(--border-radius-default, 8px);
  position: relative;
  padding: var(--padding-default, 8px);
  // font-weight: bold;

  &:hover {
    background-color: var(--color-bg-primary-offset, #f1f3f7);
  }
  ${HOVER_COLOR_OFFSET}
  ${({ css }) => kebabizeCSSObject(css)}
`

export default TextButton
