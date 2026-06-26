import { describe, expect, it } from 'vitest';

import { shouldUseMobileEditGesture } from './TimeEvent.utils';

describe('shouldUseMobileEditGesture', () => {
  it('does not enable long-press editing in desktop interaction mode', () => {
    expect(
      shouldUseMobileEditGesture({
        isMobileInteractionMode: false,
      })
    ).toBe(false);
  });

  it('enables long-press editing in mobile interaction mode', () => {
    expect(
      shouldUseMobileEditGesture({
        isMobileInteractionMode: true,
      })
    ).toBe(true);
  });
});
