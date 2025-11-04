export interface Mouse {
  click(direction: 'left' | 'right'): void
  move(route: Array<[number, number]>, duration: number): void
  drag(route: Array<[number, number]>, duration: number, direction: 'left' | 'right'): void
  flash(x: number, y: number): void
}

export interface Keyboard {
  // pressKey(keyCode: number): void
  type(str: string, interDelay?: number): void
  hold(char: number): void
  release(char: number): void
  press(char: number): void
  KEY_CTRL: number
  KEY_SHIFT: number
  KEY_ALT: number
  KEY_CAPS: number
  KEY_TAB: number
  KEY_ESC: number
  KEY_ENTER: number
  KEY_SPACE: number
  KEY_LEFT: number
  KEY_RIGHT: number
  KEY_UP: number
  KEY_DOWN: number
  KEY_F1: number
}

export const mouse: Mouse
export const keyboard: Keyboard
