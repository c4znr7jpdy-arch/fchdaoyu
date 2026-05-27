import type { TowerLeaderboardEntry } from '@shared/lib/tower';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TowerLeaderboard } from './TowerLeaderboard';

vi.mock('@app/components/game-shell', () => ({
  GameSceneSection: ({ title, children }: any) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  GameSceneTabs: ({ items, activeValue }: any) => (
    <div>
      {items.map((item: any) => (
        <span key={item.value} data-active={item.value === activeValue}>
          {item.label}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('@app/components/ui/InkCard', () => ({
  InkCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@app/components/ui/InkSelect', () => ({
  InkSelect: ({ children, value, className }: any) => (
    <div className={className} data-value={value}>
      {children}
    </div>
  ),
}));

function renderLeaderboard(entries: TowerLeaderboardEntry[]) {
  return renderToStaticMarkup(
    <TowerLeaderboard
      activeRealm="筑基"
      entries={entries}
      loading={false}
      onRealmChange={() => undefined}
    />,
  );
}

describe('TowerLeaderboard', () => {
  it('renders empty state when no entries exist', () => {
    const html = renderLeaderboard([]);

    expect(html).toContain('留名榜');
    expect(html).toContain('筑基榜');
    expect(html).toContain('本周此境尚无人留名');
    expect(html).toContain('金丹榜');
  });

  it('renders ranked entries and floors', () => {
    const html = renderLeaderboard([
      {
        cultivatorId: 'cultivator-1',
        rank: 1,
        name: '韩立',
        title: '青元子',
        realm: '筑基',
        realmStage: '后期',
        gender: '男',
        origin: '散修',
        highestFloor: 28,
        recordedRealm: '筑基',
        firstReachedAt: '2026-05-26T10:00:00.000Z',
        isSelf: true,
      },
    ]);

    expect(html).toContain('第 1 名');
    expect(html).toContain('韩立');
    expect(html).toContain('28 层');
    expect(html).toContain('境界：筑基 后期');
    expect(html).toContain('overflow-y-auto');
    expect(html).toContain('overflow-hidden');
    expect(html).toContain('overflow-x-hidden');
    expect(html).toContain('grid-cols-[minmax(0,1fr)_auto]');
  });
});
