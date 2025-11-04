import { SVGButton } from 'lib/frame/generic'
import { CSSProperties, FC, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const ShrinkerFrame = styled(SVGButton)``

type ShrinkerProps = {
  target: React.RefObject<HTMLElement> | string
  direction: 'vertical' | 'horizontal' | 'both'
  ratio?: number
  cssFrame?: CSSProperties
  cssShrinking?: CSSProperties
  cssExtending?: CSSProperties
}

/**
 * this component should be rendered near target component as a sibling
 * if you render it as target's child, It could cause a problem that shrinker can't be shown on screen when It shrink
 */
export const Shrinker: FC<PropsWithChildren<ShrinkerProps>> = ({
  target,
  direction,
  ratio = 1,
  cssFrame,
  cssShrinking,
  cssExtending,
  children
}) => {
  const [isShrinked, setIsShrinked] = useState<boolean>(false)
  const [isBeingAnimated, setIsBeingAnimated] = useState<boolean>(false)
  const shrink = useRef<Array<Keyframe>>([]).current
  //   const ref = useRef<HTMLDivElement & HTMLButtonElement>(null)
  //   let beingAnimated = false

  useEffect(function initKeyframes() {
    // if (!ref.current) return
    const container = typeof target === 'string' ? document.querySelector(target) : target.current
    if (!container) return

    const { width, minWidth, height, minHeight, paddingTop, paddingRight, paddingBottom, paddingLeft } =
      getComputedStyle(container)

    const extractNumber = (px: string) => {
      const s = /\d+/.exec(px)
      if (!s) return 0

      return parseInt(s[0], 10)
    }

    switch (direction) {
      case 'horizontal':
        shrink.push(
          { width, minWidth, paddingLeft, paddingRight },
          {
            width: `${Math.floor((1 - ratio) * extractNumber(width))}px`,
            minWidth: `${Math.floor((1 - ratio) * extractNumber(minWidth))}px`,
            paddingLeft: `${Math.floor((1 - ratio) * extractNumber(paddingLeft))}px`,
            paddingRight: `${Math.floor((1 - ratio) * extractNumber(paddingRight))}px`
          }
        )
        break
      case 'vertical':
        shrink.push(
          { height, minHeight, paddingTop, paddingBottom },
          {
            height: `${Math.floor((1 - ratio) * extractNumber(height))}px`,
            minHeight: `${Math.floor((1 - ratio) * extractNumber(minHeight))}px`,
            paddingTop: `${Math.floor((1 - ratio) * extractNumber(paddingTop))}px`,
            paddingBottom: `${Math.floor((1 - ratio) * extractNumber(paddingBottom))}px`
          }
        )
        break
      case 'both':
        shrink.push(
          { width, minWidth, height, minHeight, paddingTop, paddingRight, paddingBottom, paddingLeft },
          {
            width: `${Math.floor((1 - ratio) * extractNumber(width))}px`,
            minWidth: `${Math.floor((1 - ratio) * extractNumber(minWidth))}px`,
            height: `${Math.floor((1 - ratio) * extractNumber(height))}px`,
            minHeight: `${Math.floor((1 - ratio) * extractNumber(minHeight))}px`,
            paddingLeft: `${Math.floor((1 - ratio) * extractNumber(paddingLeft))}px`,
            paddingRight: `${Math.floor((1 - ratio) * extractNumber(paddingRight))}px`,
            paddingTop: `${Math.floor((1 - ratio) * extractNumber(paddingTop))}px`,
            paddingBottom: `${Math.floor((1 - ratio) * extractNumber(paddingBottom))}px`
          }
        )
        break
      default:
        break
    }

    // console.log(`css props : ${ShrinkerFrame}`)
  }, [])

  const toggle: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    function (e) {
      if (isBeingAnimated) return
      const container = typeof target === 'string' ? document.querySelector(target) : target.current
      if (!container) return
      //   console.log(`keyframes on anim ${JSON.stringify(shrink)}`)

      const anim = container.animate(shrink, {
        duration: 400,
        // fill: animDirection === 'normal' ? 'forwards' : 'backwards',
        fill: 'forwards',
        direction: isShrinked ? 'reverse' : 'normal'
      })
      setIsBeingAnimated(true)

      anim.onfinish = function (e) {
        e.preventDefault()
        setIsShrinked(!isShrinked)
        setIsBeingAnimated(false)
        // anim.updatePlaybackRate(animDirection === 'normal' ? -1 : 1)
      }
    },
    [isShrinked, isBeingAnimated]
  )

  return (
    <ShrinkerFrame
      onClick={toggle}
      /**
       * this causes resetting on css properties
       *
       */
      // css={cssFrame}
      /**
       * css as literal because it changes frequently
       * !== can play logical xor operator, bitwise xor operator is ^
       */
      style={isBeingAnimated !== isShrinked ? { ...cssShrinking, ...cssFrame } : { ...cssExtending, ...cssFrame }}
    >
      {children}
    </ShrinkerFrame>
  )
}
