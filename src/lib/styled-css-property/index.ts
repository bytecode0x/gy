import { css } from 'styled-components'
import { showup } from './keyframes'

const SCROLL = css`
  /* width */
  ::-webkit-scrollbar {
    width: var(--scroll-track-size-default, 6px);
    height: var(--scroll-track-size-default, 6px);
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: var(--color-bg-primary, #ffffff);
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    border-radius: 8px;
    background: var(--color-scroll-thumb, #888);
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-scroll-thumb-offset, #555);
  }

  /* the bottom corner of the scrollbar, where both horizontal and vertical scrollbars meet */
  ::-webkit-scrollbar-corner {
    background: var(--color-bg-primary, #ffffff);
  }
`

const FLEX_CENTER = css`
  display: flex;
  justify-content: center;
  align-items: center;
`

const FLEX_COLUMN_CENTER = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const HOVER_BGC_OFFSET = css`
  &:hover {
    background-color: var(--color-bg-primary-offset);
  }
`

const HOVER_COLOR_OFFSET = css`
  &:hover {
    color: var(--color-text-primary-offset, #898c94);
  }
`

const HOVER_OFFSET = css`
  &:hover {
    background-color: var(--color-bg-primary-offset);
    color: var(--color-text-primary-offset);
  }
`

const NO_SELECT = css`
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
`

const HOVER_DESCRIPTION = css`
  &[data-desc]:hover::after {
    content: attr(data-desc);
    position: absolute;
    // inset: 0;
    top: calc(100% + 4px);
    background-color: var(--color-bg-hover-desc);
    color: var(--color-text-hover-desc);
    z-index: 2;
    font-size: var(--font-size-after);
    white-space: nowrap;
    text-align: center;
    padding: 4px;
    border-radius: 4px;
    animation: ${showup} 0.5s;
  }
`

export {
  FLEX_CENTER,
  FLEX_COLUMN_CENTER,
  HOVER_BGC_OFFSET,
  HOVER_COLOR_OFFSET,
  HOVER_DESCRIPTION,
  HOVER_OFFSET,
  NO_SELECT,
  SCROLL
}
