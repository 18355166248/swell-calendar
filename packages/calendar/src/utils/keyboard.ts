import { KEY, KEYCODE } from '@/constants/keyboard';
import { KeyboardEvent } from 'react';

export function isKeyPressed(e: KeyboardEvent, key: KEY) {
  return e.key ? e.key === key : e.keyCode === KEYCODE[key];
}
