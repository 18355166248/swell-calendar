import { MouseEvent, KeyboardEvent } from 'react';

export type TimeUnit = 'second' | 'minute' | 'hour' | 'date' | 'month' | 'year';

export type MouseEventListener = (e: MouseEvent) => void;
export type KeyboardEventListener = (e: KeyboardEvent) => void;
