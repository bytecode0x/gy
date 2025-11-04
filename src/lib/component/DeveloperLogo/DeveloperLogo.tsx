import PlayNProvide from 'lib/asset/svg/PlayNProvide'
import { FlexCenterDiv } from 'lib/frame/generic'
import { FC } from 'react'

import styled from 'styled-components'

const LogoContainer = styled(FlexCenterDiv)`
  padding: 4px;
  position: relative;

  height: 40px !important;
  width: 40px !important;
  border-radius: 50%;
  box-shadow: var(--shadow-menu-light);
  background-color : var(--color-bg-primary);

  &:hover {
    var(--color-bg-primary-offset);
  }

  & > svg {
    height : 32px;
    width : 32px;
    color: var(--color-text-primary);
    stroke: var(--color-text-primary);
  }

  &:hover > svg {
    padding: 2px;
    transition: padding 0.2s;
  }
`

type Props = {
  desc?: string
  desc2?: string
}
// & SCProps<typeof LogoContainer>

export const DeveloperLogo: FC<Props> = ({ desc2, desc, ...props }) => {
  return (
    // <a
    // href='https://discord.gg/sBu588xNrQ'
    //   target='_blank'
    //   rel='noreferrer'
    // >
    // </a>
    <LogoContainer {...props} data-desc={desc || undefined} data-desc2={desc2 || undefined}>
      <PlayNProvide />
    </LogoContainer>
  )
}
