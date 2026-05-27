import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cultivator } from '@shared/types/cultivator';

vi.mock('@app/lib/contexts/CultivatorContext', () => ({
  useCultivator: vi.fn(),
}));

vi.mock('@app/lib/hooks/tower/useTowerState', () => ({
  useTowerState: vi.fn(),
}));

vi.mock('@app/lib/hooks/tower/useTowerActions', () => ({
  useTowerActions: vi.fn(),
}));

vi.mock('@app/lib/hooks/tower/useTowerLeaderboard', () => ({
  useTowerLeaderboard: vi.fn(),
}));

vi.mock('@app/components/game-shell', () => ({
  GameSceneFrame: ({ title, description, headerMeta, aside, children }: any) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{headerMeta}</div>
      <div>{aside}</div>
      <div>{children}</div>
    </div>
  ),
  GameSceneSection: ({ title, children }: any) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  GameSceneAsideSection: ({ title, children }: any) => (
    <aside>
      <h3>{title}</h3>
      {children}
    </aside>
  ),
  GameSceneLoading: ({ message }: any) => <div>{message}</div>,
  GameSceneNote: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@app/components/ui/InkBadge', () => ({
  InkBadge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@app/components/ui/InkButton', () => ({
  InkButton: ({ children, disabled }: any) => (
    <button disabled={disabled}>{children}</button>
  ),
}));

vi.mock('@app/components/ui/InkCard', () => ({
  InkCard: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@app/components/cultivator/StatusCard', () => ({
  StatusCard: ({ buffs }: any) => (
    <div>{`statuses:${Array.isArray(buffs) ? buffs.length : 0}`}</div>
  ),
}));

vi.mock('@app/components/func/LingGen', () => ({
  LingGenMini: () => <div>LingGenMini</div>,
}));

vi.mock('./components/TowerBattlePanel', () => ({
  TowerBattlePanel: () => <div>TowerBattlePanel</div>,
}));

vi.mock('./components/TowerLeaderboard', () => ({
  TowerLeaderboard: ({ activeRealm, entries }: any) => (
    <div>{`leaderboard:${activeRealm}:${entries.length}`}</div>
  ),
}));

import { useCultivator } from '@app/lib/contexts/CultivatorContext';
import { useTowerActions } from '@app/lib/hooks/tower/useTowerActions';
import { useTowerLeaderboard } from '@app/lib/hooks/tower/useTowerLeaderboard';
import { useTowerState } from '@app/lib/hooks/tower/useTowerState';
import TowerPage from './route';

const mockedUseCultivator = vi.mocked(useCultivator);
const mockedUseTowerState = vi.mocked(useTowerState);
const mockedUseTowerActions = vi.mocked(useTowerActions);
const mockedUseTowerLeaderboard = vi.mocked(useTowerLeaderboard);

function createCultivator(overrides: Partial<Cultivator> = {}): Cultivator {
  return {
    id: 'cultivator-1',
    name: '韩立',
    title: null,
    gender: '男',
    realm: '筑基',
    realm_stage: '中期',
    age: 40,
    lifespan: 260,
    attributes: {
      vitality: 52,
      spirit: 58,
      wisdom: 50,
      speed: 48,
      willpower: 44,
    },
    spiritual_roots: [{ element: '木', strength: 82 }],
    pre_heaven_fates: [],
    cultivations: [],
    skills: [],
    inventory: {
      artifacts: [],
      consumables: [],
      materials: [],
    },
    equipped: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    max_skills: 4,
    spirit_stones: 0,
    background: '测试角色',
    ...overrides,
  };
}

describe('TowerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseCultivator.mockReturnValue({
      cultivator: createCultivator(),
      finalAttributes: {
        maxHp: 360,
        maxMp: 180,
      },
      isLoading: false,
      refreshCultivator: vi.fn(),
    } as any);
    mockedUseTowerState.mockReturnValue({
      payload: {
        season: {
          seasonKey: '2026-W22@Asia/Shanghai',
          seasonStartedAt: '2026-05-25T16:00:00.000Z',
          seasonEndsAt: '2026-06-01T16:00:00.000Z',
          nextResetAt: '2026-06-01T16:00:00.000Z',
        },
        state: null,
      },
      setPayload: vi.fn(),
      loading: false,
    });
    mockedUseTowerActions.mockReturnValue({
      startRun: vi.fn(),
      probeBattle: vi.fn(),
      chooseBlessing: vi.fn(),
      resetRun: vi.fn(),
      processing: false,
    });
    mockedUseTowerLeaderboard.mockReturnValue({
      payload: {
        season: {
          seasonKey: '2026-W22@Asia/Shanghai',
          seasonStartedAt: '2026-05-25T16:00:00.000Z',
          seasonEndsAt: '2026-06-01T16:00:00.000Z',
          nextResetAt: '2026-06-01T16:00:00.000Z',
        },
        realm: '筑基',
        entries: [],
      },
      loading: false,
    });
  });

  it('shows the weekly home state and defaults leaderboard tabs to the live cultivator realm', () => {
    const html = renderToStaticMarkup(<TowerPage />);

    expect(html).toContain('蜃楼幻境');
    expect(html).toContain('本周未入境');
    expect(html).toContain('踏入本周幻境');
    expect(html).toContain('leaderboard:筑基:0');
  });

  it('renders a probe fallback card while waiting battle details are still missing', () => {
    mockedUseTowerState.mockReturnValue({
      payload: {
        season: {
          seasonKey: '2026-W22@Asia/Shanghai',
          seasonStartedAt: '2026-05-25T16:00:00.000Z',
          seasonEndsAt: '2026-06-01T16:00:00.000Z',
          nextResetAt: '2026-06-01T16:00:00.000Z',
        },
        state: {
          runId: 'run-1',
          seasonKey: '2026-W22@Asia/Shanghai',
          status: 'WAITING_BATTLE',
          currentFloor: 4,
          highestFloorCleared: 3,
          activeBattleId: 'battle-1',
          condition: {
            version: 1,
            resources: {
              hp: { current: 220 },
              mp: { current: 95 },
            },
            gauges: { pillToxicity: 0 },
            tracks: {
              tempering: {
                vitality: { level: 0, progress: 0 },
                spirit: { level: 0, progress: 0 },
                wisdom: { level: 0, progress: 0 },
                speed: { level: 0, progress: 0 },
                willpower: { level: 0, progress: 0 },
              },
              marrowWash: { level: 0, progress: 0 },
            },
            counters: {
              longTermPillUsesByRealm: {},
              cultivationPillUsesByRealm: {},
            },
            statuses: [],
            timestamps: {
              lastRecoveryAt: '2026-05-26T00:00:00.000Z',
            },
            metrics: {
              totalRecoveredHp: 0,
              totalRecoveredMp: 0,
            },
          },
          blessings: {},
          pendingBlessingChoices: [],
          claimedMilestones: [],
          milestoneRewardLog: [],
        },
      },
      setPayload: vi.fn(),
      loading: false,
    });

    const html = renderToStaticMarkup(<TowerPage />);

    expect(html).toContain('眼前幻影');
    expect(html).toContain('照见前路幻影');
  });

  it('renders blessing selection state with isolated tower resources', () => {
    mockedUseTowerState.mockReturnValue({
      payload: {
        season: {
          seasonKey: '2026-W22@Asia/Shanghai',
          seasonStartedAt: '2026-05-25T16:00:00.000Z',
          seasonEndsAt: '2026-06-01T16:00:00.000Z',
          nextResetAt: '2026-06-01T16:00:00.000Z',
        },
        state: {
          runId: 'run-1',
          seasonKey: '2026-W22@Asia/Shanghai',
          status: 'CHOOSING_BLESSING',
          currentFloor: 6,
          highestFloorCleared: 5,
          condition: {
            version: 1,
            resources: {
              hp: { current: 188 },
              mp: { current: 73 },
            },
            gauges: { pillToxicity: 0 },
            tracks: {
              tempering: {
                vitality: { level: 0, progress: 0 },
                spirit: { level: 0, progress: 0 },
                wisdom: { level: 0, progress: 0 },
                speed: { level: 0, progress: 0 },
                willpower: { level: 0, progress: 0 },
              },
              marrowWash: { level: 0, progress: 0 },
            },
            counters: {
              longTermPillUsesByRealm: {},
              cultivationPillUsesByRealm: {},
            },
            statuses: [],
            timestamps: {
              lastRecoveryAt: '2026-05-26T00:00:00.000Z',
            },
            metrics: {
              totalRecoveredHp: 0,
              totalRecoveredMp: 0,
            },
          },
          blessings: {
            vitality_surge: 1,
          },
          pendingBlessingChoices: [
            {
              id: 'jade_bones',
              name: '玉骨',
              description: '本场之前，道骨先稳一寸。',
              currentStacks: 0,
              nextStacks: 1,
              maxStacks: 5,
            },
          ],
          claimedMilestones: [],
          milestoneRewardLog: [],
        },
      },
      setPayload: vi.fn(),
      loading: false,
    });

    const html = renderToStaticMarkup(<TowerPage />);

    expect(html).toContain('当前所至：第 6 重');
    expect(html).toContain('境内气血：188 / 360');
    expect(html).toContain('境内法力：73 / 180');
    expect(html).toContain('残留机缘');
    expect(html).toContain('玉骨');
    expect(html).toContain('承此机缘');
  });
});
