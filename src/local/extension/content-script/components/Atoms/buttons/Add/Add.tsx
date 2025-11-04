import Plus from 'lib/asset/svg/Plus'
import { FC } from 'react'
import { Frame } from '../frame'

type AddProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  desc?: string
}

const Add: FC<AddProps> = ({ onClick, desc }) => {
  return (
    <Frame data-desc2={desc} onClick={onClick}>
      <Plus />
    </Frame>
  )
}

export default Add
