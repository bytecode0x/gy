import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 800px;
  height: 500px;
  border: 2px solid #aaa;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  overflow: auto;
  padding: 8px;
  gap: 8px;
  box-sizing: border-box;
`

const Box = styled.div<{ width: number; height: number; isResizing: boolean }>`
  position: relative;
  background: ${({ isResizing }) => (isResizing ? '#e0f7fa' : '#b3e5fc')};
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  border: 2px solid #0288d1;
  box-sizing: border-box;
  flex-shrink: 0;
  transition: background 0.2s;
`

// 리사이즈 핸들
const Handle = styled.div<{ cursor: string }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: transparent;
  z-index: 10;
  ${({ cursor }) => cursor && `cursor: ${cursor};`}

  &.top-left {
    top: -5px;
    left: -5px;
    cursor: nwse-resize;
  }
  &.top {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    cursor: ns-resize;
  }
  &.top-right {
    top: -5px;
    right: -5px;
    cursor: nesw-resize;
  }
  &.right {
    top: 50%;
    right: -5px;
    transform: translateY(-50%);
    cursor: ew-resize;
  }
  &.bottom-right {
    bottom: -5px;
    right: -5px;
    cursor: nwse-resize;
  }
  &.bottom {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    cursor: ns-resize;
  }
  &.bottom-left {
    bottom: -5px;
    left: -5px;
    cursor: nesw-resize;
  }
  &.left {
    top: 50%;
    left: -5px;
    transform: translateY(-50%);
    cursor: ew-resize;
  }
`

const ResizableBox: React.FC<React.PropsWithChildren<{ initialWidth: number; initialHeight: number }>> = ({
  initialWidth,
  initialHeight,
  children
}) => {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
  const [isResizing, setIsResizing] = useState(false)
  const resizeDir = useRef<string | null>(null)
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const onMouseDown = (e: React.MouseEvent, dir: string) => {
    e.preventDefault()
    resizeDir.current = dir
    startPos.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height }
    setIsResizing(true)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeDir.current) return

    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    let newWidth = startPos.current.width
    let newHeight = startPos.current.height

    if (resizeDir.current.includes('right')) newWidth += dx
    if (resizeDir.current.includes('left')) newWidth -= dx
    if (resizeDir.current.includes('bottom')) newHeight += dy
    if (resizeDir.current.includes('top')) newHeight -= dy

    newWidth = Math.max(50, newWidth)
    newHeight = Math.max(50, newHeight)

    setSize({ width: newWidth, height: newHeight })
  }, [])

  const onMouseUp = useCallback(() => {
    setIsResizing(false)
    resizeDir.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  return (
    <Box width={size.width} height={size.height} isResizing={isResizing}>
      {['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'].map((pos) => (
        <Handle key={pos} className={pos} cursor='' onMouseDown={(e) => onMouseDown(e, pos)} />
      ))}
      {children}
    </Box>
  )
}

export default ResizableBox
