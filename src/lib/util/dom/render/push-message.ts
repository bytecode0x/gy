export const pushMessage = ({
  id,
  message,
  layer = document.querySelector('#push'),
  autoRemove = true
}: {
  id?: string
  message: string
  autoRemove?: boolean
  layer?: Element | null
}) => {
  if (!layer) return

  if (id) {
    const _blacklist = localStorage.getItem('blacklist')
    const blacklist = _blacklist ? (JSON.parse(_blacklist) as Array<string>) : []
    if (blacklist.includes(id)) return
  }
  const frame = document.createElement('div')
  frame.innerHTML =
    /* HTML */
    `
      <div>
        <div>
          <div data-desc-top="닫기">
            <button>
              <svg width="200px" height="200px" viewBox="0 0 200 200" fill="currentColor">
                <path
                  d="M114,100l49-49a9.9,9.9,0,0,0-14-14L100,86,51,37A9.9,9.9,0,0,0,37,51l49,49L37,149a9.9,9.9,0,0,0,14,14l49-49,49,49a9.9,9.9,0,0,0,14-14Z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <span>${message}</span>
      </div>
    `

  const container = frame.firstElementChild as HTMLDivElement
  container.classList.add('push-container')

  if (autoRemove) {
    container.setAttribute('fading', 'true')
    container.addEventListener('animationend', function (e) {
      if (e.currentTarget === e.target) frame.remove()
    })
  }

  const chrome = container.firstElementChild as HTMLDivElement
  chrome.classList.add('push-chrome')

  const closeButton = chrome.firstElementChild as HTMLButtonElement
  closeButton.addEventListener(
    'click',
    function () {
      frame.remove()
    },
    { once: true }
  )

  if (id) {
    const rememberButton = document.createElement('button')
    rememberButton.innerHTML = `<svg
      viewBox='0 0 24 24'
      width='24'
      height='24'
      stroke='currentColor'
      stroke-width='2'
      fill='none'
      stroke-linecap='round'
      stroke-linejoin='round'
    >
      <line x1='5' y1='12' x2='19' y2='12' />
    </svg>`
    rememberButton.addEventListener(
      'click',
      function (e) {
        const _blacklist = localStorage.getItem('blacklist')
        const blacklist = _blacklist ? (JSON.parse(_blacklist) as Array<string>) : []
        blacklist.push(id)
        localStorage.setItem('blacklist', JSON.stringify(blacklist))
        frame.remove()
      },
      { once: true }
    )
    chrome.append(rememberButton)
  }

  const flyin = [{ transform: 'translateX(100%)' }, { transform: 'translateX(0%)' }]
  frame.animate(flyin, 400)
  layer.append(frame)
}
