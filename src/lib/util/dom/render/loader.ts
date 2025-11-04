export function overlayLoader(t: HTMLElement | string) {
  const target = typeof t === 'string' ? (document.querySelector(t) as HTMLElement) : t
  if (!target) throw new Error('OVERLAY_LOADER:NO_TARGET_FOUND')

  const { width, height } = target.getBoundingClientRect()

  const loaderSize = Math.min(Math.floor(Math.min(width, height) / 2), 100)

  const container = document.createElement('div')
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.top = '0'
  container.style.left = '0'
  container.style.zIndex = '2147483647'
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.justifyContent = 'center'
  container.style.position = 'relative'
  container.innerHTML =
    /* HTML */
    `<svg
      x="0px"
      y="0px"
      width="${loaderSize}px"
      height="${loaderSize}px"
      viewBox="0 0 50 50"
      xmlspace="preserve"
      fill="currentColor"
    >
      <path
        d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"
      >
        <animateTransform
          attributeType="xml"
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.6s"
          repeatCount="indefinite"
        ></animateTransform>
      </path>
    </svg>`

  const { position: originalPosition, pointerEvents: originalPointerEvents } = window.getComputedStyle(target)

  target.style.position = 'relative'
  target.style.pointerEvents = 'none'

  target.append(container)

  return function revert() {
    target.style.position = originalPosition
    target.style.pointerEvents = originalPointerEvents
    container.remove()
  }
}
