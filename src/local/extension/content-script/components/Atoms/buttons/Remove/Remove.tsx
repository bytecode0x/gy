import Remove3 from 'lib/asset/svg/Remove3'
import React from 'react'
import { Frame } from '../frame'

type RemoveProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  desc?: string
}

const Remove: React.FC<RemoveProps> = ({ onClick, desc }) => {
  return (
    <Frame data-desc2={desc} onClick={onClick}>
      <Remove3 />
    </Frame>
  )
}

export default React.memo(Remove)
