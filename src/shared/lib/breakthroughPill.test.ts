import { describe, expect, it } from 'vitest';

import { getBreakthroughPillLabel } from './breakthroughPill';

describe('getBreakthroughPillLabel', () => {
  it('returns dedicated names for higher-realm breakthrough pills', () => {
    expect(getBreakthroughPillLabel('化神')).toBe('叩神丹');
    expect(getBreakthroughPillLabel('炼虚')).toBe('洞虚丹');
    expect(getBreakthroughPillLabel('合体')).toBe('合真丹');
    expect(getBreakthroughPillLabel('大乘')).toBe('证道丹');
    expect(getBreakthroughPillLabel('渡劫')).toBe('应劫丹');
  });
});
