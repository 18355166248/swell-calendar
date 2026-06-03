export enum KEY {
  ESCAPE = 'Escape',
  ENTER = 'Enter',
  SPACE = ' ',
  DELETE = 'Delete',
  BACKSPACE = 'Backspace',
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',
  TAB = 'Tab',
}

export const KEYCODE: Record<KEY, number> = {
  [KEY.ESCAPE]: 27,
  [KEY.ENTER]: 13,
  [KEY.SPACE]: 32,
  [KEY.DELETE]: 46,
  [KEY.BACKSPACE]: 8,
  [KEY.ARROW_UP]: 38,
  [KEY.ARROW_DOWN]: 40,
  [KEY.ARROW_LEFT]: 37,
  [KEY.ARROW_RIGHT]: 39,
  [KEY.TAB]: 9,
};
