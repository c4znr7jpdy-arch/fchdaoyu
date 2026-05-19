import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HomeAside } from './HomeAside';

vi.mock('./DivineFortune', () => ({
  DivineFortune: () => <div>◆ 今日天机 ◆</div>,
}));

vi.mock('@app/components/feature/ranking/RecentBattles', () => ({
  RecentBattles: () => <div>近期战札内容</div>,
}));

describe('HomeAside', () => {
  it('keeps the inner fortune title and removes the outer duplicate title', () => {
    const html = renderToStaticMarkup(<HomeAside />);

    expect(html).toContain('◆ 今日天机 ◆');
    expect(html).toContain('近况卷 · 近期战札');
    expect(html).not.toContain('近况卷 · 今日卜辞');
  });
});
