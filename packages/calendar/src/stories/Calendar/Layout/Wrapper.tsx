import { PropsWithChildren } from 'react';

export function Wrapper({ children }: PropsWithChildren) {
  return <div style={{ position: 'absolute', inset: 0 }}>{children}</div>;
}
