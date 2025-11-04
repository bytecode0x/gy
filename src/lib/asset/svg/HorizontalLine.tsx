import { FC } from 'react'

type HorizontalLineProps = {
  width?: string
  height?: string
}

const HorizontalLine: FC<HorizontalLineProps> = ({ height, width }) => {
  return (
    <svg
      width={width || '1em'}
      preserveAspectRatio='none'
      height={height || '1em'}
      viewBox='0 0 64 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect y='11' width='64' height='2' fill='url(#paint0_linear_24_8)' />
      <defs>
        <linearGradient
          id='paint0_linear_24_8'
          x1='8.9407e-8'
          y1='12'
          x2='64'
          y2='12'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#6F60CC' />
          <stop offset='1' stopColor='#FF807B' />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default HorizontalLine
