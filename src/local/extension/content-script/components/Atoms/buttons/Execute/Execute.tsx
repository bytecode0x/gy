import Play from 'lib/asset/svg/Play'
import React from 'react'
import { Frame } from '../frame'

type ExecuteProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  desc?: string
}

const Execute: React.FC<ExecuteProps> = ({ onClick, desc }) => {
  return (
    <Frame data-desc2={desc} onClick={onClick}>
      <Play />
    </Frame>
  )
}

export default React.memo(Execute)
