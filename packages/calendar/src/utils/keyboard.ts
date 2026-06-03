import { KeyboardEvent } from 'react';

import { KEY, KEYCODE } from '@/constants/keyboard';

export function isKeyPressed(e: KeyboardEvent, key: KEY) {
  return e.key ? e.key === key : e.keyCode === KEYCODE[key];
}
