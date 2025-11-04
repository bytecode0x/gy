import { safeGetBody } from './app'

export function removeUI() {
  ;(safeGetBody().querySelector('#top') as HTMLElement)?.classList.add('none')
  ;(safeGetBody().querySelector('#right') as HTMLElement)?.classList.add('none')
  ;(safeGetBody().querySelector('#left') as HTMLElement)?.classList.add('none')
  ;(safeGetBody().querySelector('#bottom') as HTMLElement)?.classList.add('none')
}

export function displayUI() {
  ;(safeGetBody().querySelector('#top') as HTMLElement)?.classList.remove('none')
  ;(safeGetBody().querySelector('#right') as HTMLElement)?.classList.remove('none')
  ;(safeGetBody().querySelector('#left') as HTMLElement)?.classList.remove('none')
  ;(safeGetBody().querySelector('#bottom') as HTMLElement)?.classList.remove('none')
}
