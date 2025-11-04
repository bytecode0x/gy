import Write from 'lib/asset/svg/Write'
import React from 'react'
import { Frame } from '../frame'

type ExecuteProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  desc?: string
}

const Execute: React.FC<ExecuteProps> = ({ onClick, desc }) => {
  return (
    <Frame data-desc2={desc} onClick={onClick}>
      <Write />
    </Frame>
  )
}

export default React.memo(Execute)
