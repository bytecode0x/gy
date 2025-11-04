import { FlexColumnCenterDiv } from 'lib/frame/generic'
import { OverlayDialog } from 'lib/frame/sementic'
import { getOverlayStore } from 'local/extension/content-script/store'
import { useCallback } from 'react'
import styled from 'styled-components'
import shallow from 'zustand/shallow'

const Container = styled(FlexColumnCenterDiv)`
  &:empty {
    display: none;
  }
  width: 100vw;
  height: 100vh;
  position: relative;
  z-index: 1;

  & > * {
    margin: 2em;
  }

  & > ${OverlayDialog}:not(:last-of-type) {
    display: none !important;
  }
`

// eslint-disable-next-line react/prop-types
const Overlay = () => {
  const [overlay, setOverlay] = getOverlayStore()(
    useCallback((state) => [state.overlay, state.setOverlay], []),
    shallow
  )

  const clearOverlay: React.MouseEventHandler<HTMLDivElement> = useCallback(
    function (e) {
      if (e.currentTarget !== e.target) return

      setOverlay(overlay.slice(0, overlay.length - 1))
    },
    [overlay]
  )

  return (
    <Container
      id='ol'
      // onDoubleClick={clearOverlay}
    >
      {overlay}
    </Container>
  )
}

export default Overlay
