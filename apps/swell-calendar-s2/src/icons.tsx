// Spectrum-style line icons (1.7px stroke, rounded) — 移植自设计稿 icons.jsx
import type { ReactNode } from 'react';

const S = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const Ic = {
  cal: () =>
    S(
      <>
        <rect x={3} y={4.5} width={18} height={16} rx={3} />
        <path d="M3 9h18" />
        <path d="M8 2.5v4" />
        <path d="M16 2.5v4" />
      </>
    ),
  day: () =>
    S(
      <>
        <rect x={4} y={4.5} width={16} height={16} rx={3} />
        <path d="M4 9h16" />
        <path d="M12 13v4" />
      </>
    ),
  week: () =>
    S(
      <>
        <rect x={3} y={4.5} width={18} height={16} rx={3} />
        <path d="M3 9h18" />
        <path d="M9 9v11" />
        <path d="M15 9v11" />
      </>
    ),
  month: () =>
    S(
      <>
        <rect x={3} y={4.5} width={18} height={16} rx={3} />
        <path d="M3 9h18" />
        <path d="M9 9v11" />
        <path d="M15 9v11" />
        <path d="M3 14.5h18" />
      </>
    ),
  sched: () =>
    S(
      <>
        <path d="M3 6h4" />
        <path d="M3 12h4" />
        <path d="M3 18h4" />
        <rect x={9} y={4} width={12} height={4} rx={1.5} />
        <rect x={9} y={10} width={8} height={4} rx={1.5} />
        <rect x={9} y={16} width={11} height={4} rx={1.5} />
      </>
    ),
  timeline: () =>
    S(
      <>
        <circle cx={6} cy={6} r={2} />
        <circle cx={6} cy={12} r={2} />
        <circle cx={6} cy={18} r={2} />
        <path d="M6 8v2" />
        <path d="M6 14v2" />
        <path d="M11 6h10" />
        <path d="M11 12h10" />
        <path d="M11 18h10" />
      </>
    ),
  plus: () =>
    S(
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
  chevL: () => S(<path d="M15 6l-6 6 6 6" />),
  chevR: () => S(<path d="M9 6l6 6-6 6" />),
  chevD: () => S(<path d="M6 9l6 6 6-6" />),
  search: () =>
    S(
      <>
        <circle cx={11} cy={11} r={7} />
        <path d="M20 20l-3.5-3.5" />
      </>
    ),
  bell: () =>
    S(
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
  settings: () =>
    S(
      <>
        <circle cx={12} cy={12} r={3} />
        <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H2a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3.6 6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
      </>
    ),
  clock: () =>
    S(
      <>
        <circle cx={12} cy={12} r={8.5} />
        <path d="M12 7v5l3 2" />
      </>
    ),
  pin: () =>
    S(
      <>
        <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" />
        <circle cx={12} cy={10} r={2.5} />
      </>
    ),
  users: () =>
    S(
      <>
        <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
        <circle cx={10} cy={8} r={3.5} />
        <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4" />
        <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" />
      </>
    ),
  user: () =>
    S(
      <>
        <circle cx={12} cy={8} r={4} />
        <path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
      </>
    ),
  door: () =>
    S(
      <>
        <path d="M4 21h16" />
        <path d="M6 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" />
        <circle cx={14} cy={12} r={1} />
      </>
    ),
  edit: () => S(<path d="M16.5 4.5l3 3L8 19l-4 1 1-4z" />),
  trash: () =>
    S(
      <>
        <path d="M4 7h16" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      </>
    ),
  check: () => S(<path d="M5 12.5l4.5 4.5L19 7" />),
  video: () =>
    S(
      <>
        <rect x={3} y={6} width={13} height={12} rx={2.5} />
        <path d="M16 10l5-3v10l-5-3" />
      </>
    ),
  repeat: () =>
    S(
      <>
        <path d="M17 2l3 3-3 3" />
        <path d="M20 5H8a4 4 0 0 0-4 4v1" />
        <path d="M7 22l-3-3 3-3" />
        <path d="M4 19h12a4 4 0 0 0 4-4v-1" />
      </>
    ),
  sidebar: () =>
    S(
      <>
        <rect x={3} y={4.5} width={18} height={15} rx={2.5} />
        <path d="M9 4.5v15" />
      </>
    ),
  filter: () => S(<path d="M3 5h18l-7 8v6l-4-2v-4z" />),
  inbox: () =>
    S(
      <>
        <path d="M3 13h5l1.5 2.5h5L21 13" />
        <path d="M3 13l3-8h12l3 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </>
    ),
  swell: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 13c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4" />
    </svg>
  ),
};
