import { Div, FlexDiv } from 'lib/frame/generic'
import React, { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'

type Props = {
  width?: string
  height?: string
  animation?: boolean
  circular?: boolean
  direction?: 'vertical' | 'horizontal'
  control: (reset: () => void, next: () => void) => void
}

const Slider: FC<PropsWithChildren<Props>> = ({
  animation = false,
  direction = 'horizontal',
  circular = false,
  children,
  height,
  width,
  control
}) => {
  const childArray = useMemo(() => React.Children.toArray(children), [children])
  const len = childArray.length

  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  // 최신 상태의 control 함수 전달
  useEffect(() => {
    const reset = () => {
      // 즉시 초기화: animating도 false로
      setAnimating(false)
      setIndex(0)
    }

    const next = () => {
      // 애니메이션 사용중이면 무시
      if (animating) return

      // 다음 인덱스 계산
      const willAdvance = (prev: number) => {
        const proposed = prev + 1
        if (proposed >= len) {
          if (circular && len > 0) return 0
          return prev // 변경 없음
        }
        return proposed
      }

      const shouldChange = (() => {
        // 미리 판단해서 변경이 없으면 아무것도 안함
        const newIndex = willAdvance(index)
        return newIndex !== index
      })()

      if (!shouldChange) return

      // animation 플래그를 transform 전환이 일어날 때만 켠다
      if (animation) {
        setAnimating(true)
      }
      // 인덱스 변경 (항상 호출)
      setIndex((prev) => willAdvance(prev))
      // animation이 false면 transitionend가 발생하지 않으므로 바로 false로 되돌림
      if (!animation) {
        setAnimating(false)
      }
    }

    // control을 최신 함수로 갱신
    control(reset, next)
    // 의존성: control, animating, index, len, circular, animation
  }, [control, animating, index, len, circular, animation])

  // transition 끝났을 때만 animating false
  const handleTransitionEnd = (e?: React.TransitionEvent<HTMLDivElement>) => {
    // 만약 transition이 transform일 때만 해제 (안 그러면 다른 transition에 의해 트리거될 수 있음)
    if (e && e.propertyName && e.propertyName !== 'transform') return
    setAnimating(false)
  }

  const transform = direction === 'horizontal' ? `translateX(-${index * 100}%)` : `translateY(-${index * 100}%)`

  return (
    <Container width={width} height={height}>
      <Inner $direction={direction} $animate={animation} style={{ transform }} onTransitionEnd={handleTransitionEnd}>
        {childArray.map((child, i) => (
          <Slide key={i} $direction={direction}>
            {child}
          </Slide>
        ))}
      </Inner>
    </Container>
  )
}
export default Slider

/* Styled components */
const Container = styled(FlexDiv)<{ width?: string; height?: string }>`
  overflow: hidden;
  position: relative;
  ${({ width }) => (width ? `width: ${/^\d+$/.test(width) ? `${width}px` : width};` : '')}
  ${({ height }) => (height ? `height: ${/^\d+$/.test(height) ? `${height}px` : height};` : '')}
`

const Inner = styled(FlexDiv)<{
  $direction: 'vertical' | 'horizontal'
  $animate: boolean
}>`
  width: 100%;
  height: 100%;

  ${({ $direction }) =>
    $direction === 'vertical'
      ? css`
          flex-direction: column;
        `
      : css`
          flex-direction: row;
        `}

  ${({ $animate }) =>
    $animate
      ? css`
          transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
        `
      : css`
          transition: none;
        `}
`

const Slide = styled(Div)<{ $direction: 'vertical' | 'horizontal' }>`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
`
