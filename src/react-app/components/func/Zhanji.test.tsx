import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Zhanji, { type ZhanjiRecord } from './Zhanji';

const baseRecord = {
  id: 'battle-1',
  createdAt: '2026-05-19T10:00:00.000Z',
  battleType: 'challenge',
  winner: { id: 'cultivator-1', name: '林玄' },
  loser: { id: 'cultivator-2', name: '赵青' },
  turns: 12,
} as unknown as ZhanjiRecord;

describe('Zhanji', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-19T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a compact battle row with result, opponent, turns, and relative time', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Zhanji record={baseRecord} currentCultivatorId="cultivator-1" />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/game/battle/battle-1"');
    expect(html).toContain('【胜】');
    expect(html).toContain('赵青');
    expect(html).toContain('12回');
    expect(html).toContain('2小时前');
    expect(html).not.toContain('林玄 vs 赵青');
    expect(html).not.toContain('点击查看战报回放');
    expect(html).not.toContain('挑战');
  });

  it('falls back to both names and a placeholder when viewer context or time is missing', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Zhanji
          record={{ ...baseRecord, createdAt: null, turns: 0 }}
          currentCultivatorId={undefined}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('【战】');
    expect(html).toContain('林玄 vs 赵青');
    expect(html).toContain('0回');
    expect(html).toContain('--');
  });
});
