import { MouseEvent } from 'react';

export function isLeftMouseButton(e: MouseEvent) {
  return e.button === 0;
}
