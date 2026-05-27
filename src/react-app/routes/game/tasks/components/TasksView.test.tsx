import type { TaskInstance } from '@shared/types/task';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@app/lib/contexts/CultivatorContext', () => ({
  useCultivator: vi.fn(),
}));

vi.mock('@app/lib/hooks/useTaskList', () => ({
  useTaskList: vi.fn(),
}));

vi.mock('@app/components/game-shell', () => ({
  GameSceneFrame: ({ title, description, children }: any) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{children}</div>
    </div>
  ),
  GameSceneSection: ({ title, children }: any) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
}));

vi.mock('@app/components/feature/tasks/BreakthroughTaskCard', () => ({
  BreakthroughTaskCard: ({ task }: any) => (
    <article>{`breakthrough:${task.id}:${task.snapshot.title}`}</article>
  ),
}));

vi.mock('@app/components/feature/tasks/DailyTaskCard', () => ({
  DailyTaskCard: ({ task }: any) => (
    <article>{`daily:${task.id}:${task.snapshot.title}:${task.status}`}</article>
  ),
}));

vi.mock('@app/components/ui', () => ({
  InkNotice: ({ children }: any) => <div>{children}</div>,
}));

import { useCultivator } from '@app/lib/contexts/CultivatorContext';
import { useTaskList } from '@app/lib/hooks/useTaskList';
import { TasksView } from './TasksView';

const mockedUseCultivator = vi.mocked(useCultivator);
const mockedUseTaskList = vi.mocked(useTaskList);

function createBreakthroughTask(
  overrides: Partial<TaskInstance> = {},
): TaskInstance {
  return {
    id: overrides.id ?? 'breakthrough-1',
    definitionId: overrides.definitionId ?? 'major_breakthrough_炼气_筑基',
    category: overrides.category ?? 'breakthrough_major',
    status: overrides.status ?? 'active',
    currentStage: overrides.currentStage ?? 'foundation-pill',
    objectives: overrides.objectives ?? [],
    metadata: overrides.metadata ?? {
      fromRealm: '炼气',
      toRealm: '筑基',
      taskTheme: 'foundation',
    },
    createdAt: overrides.createdAt ?? '2026-05-26T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-26T00:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    snapshot: overrides.snapshot ?? {
      title: '筑基前引',
      summary: '备妥筑基丹，再经药园试炼稳住根基。',
      fromRealm: '炼气',
      toRealm: '筑基',
      isCompleted: false,
      currentStageId: 'foundation-pill',
      currentStageIndex: 0,
      totalStages: 2,
      missingRequirements: [],
      stages: [],
    },
  };
}

function createDailyTask(
  overrides: Partial<TaskInstance> = {},
): TaskInstance {
  return {
    id: overrides.id ?? 'daily-1',
    definitionId: overrides.definitionId ?? 'daily_alchemy_once',
    category: overrides.category ?? 'daily',
    status: overrides.status ?? 'active',
    currentStage: overrides.currentStage ?? 'daily-alchemy-stage',
    objectives: overrides.objectives ?? [],
    metadata: overrides.metadata ?? {
      dailyKind: 'alchemy',
      resetKey: '2026-05-26',
      rewardSummary: ['灵石 x300'],
    },
    createdAt: overrides.createdAt ?? '2026-05-26T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-26T00:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    snapshot: overrides.snapshot ?? {
      title: '丹炉留痕',
      summary: '今日开炉一次，让炉火与药意都别生疏。',
      isCompleted: false,
      currentStageId: 'daily-alchemy-stage',
      currentStageIndex: 0,
      totalStages: 1,
      missingRequirements: [],
      dailyKind: 'alchemy',
      resetKey: '2026-05-26',
      rewardSummary: ['灵石 x300'],
      stages: [],
    },
  };
}

describe('TasksView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders daily and breakthrough sections on the same page', () => {
    mockedUseCultivator.mockReturnValue({
      cultivator: { id: 'cultivator-1' },
      isLoading: false,
    } as any);
    mockedUseTaskList.mockReturnValue({
      tasks: [createDailyTask(), createBreakthroughTask()],
      loading: false,
      error: undefined,
      reload: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(<TasksView />);

    expect(html).toContain('今日日常');
    expect(html).toContain('破境卷宗');
    expect(html).toContain('daily:daily-1:丹炉留痕:active');
    expect(html).toContain('breakthrough:breakthrough-1:筑基前引');
  });

  it('keeps completed daily tasks in the daily section instead of archiving them', () => {
    mockedUseCultivator.mockReturnValue({
      cultivator: { id: 'cultivator-1' },
      isLoading: false,
    } as any);
    mockedUseTaskList.mockReturnValue({
      tasks: [
        createDailyTask({
          id: 'daily-completed',
          status: 'completed',
          currentStage: null,
          completedAt: '2026-05-26T01:00:00.000Z',
          snapshot: {
            title: '云游一程',
            summary: '去外界走一遭，别让道心只困在洞府里。',
            isCompleted: true,
            currentStageId: null,
            currentStageIndex: 1,
            totalStages: 1,
            missingRequirements: [],
            dailyKind: 'dungeon',
            resetKey: '2026-05-26',
            rewardSummary: ['灵石 x500'],
            stages: [],
          },
          metadata: {
            dailyKind: 'dungeon',
            resetKey: '2026-05-26',
            rewardSummary: ['灵石 x500'],
          },
        }),
        createBreakthroughTask({
          id: 'breakthrough-completed',
          status: 'completed',
          currentStage: null,
          completedAt: '2026-05-26T01:00:00.000Z',
          snapshot: {
            title: '筑基前引',
            summary: '备妥筑基丹，再经药园试炼稳住根基。',
            fromRealm: '炼气',
            toRealm: '筑基',
            isCompleted: true,
            currentStageId: null,
            currentStageIndex: 2,
            totalStages: 2,
            missingRequirements: [],
            stages: [],
          },
        }),
      ],
      loading: false,
      error: undefined,
      reload: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(<TasksView />);

    expect(html).toContain('daily:daily-completed:云游一程:completed');
    expect(html).toContain('已归卷宗');
    expect(html).toContain('breakthrough:breakthrough-completed:筑基前引');
  });

  it('shows the breakthrough empty state without hiding daily tasks', () => {
    mockedUseCultivator.mockReturnValue({
      cultivator: { id: 'cultivator-1' },
      isLoading: false,
    } as any);
    mockedUseTaskList.mockReturnValue({
      tasks: [createDailyTask()],
      loading: false,
      error: undefined,
      reload: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(<TasksView />);

    expect(html).toContain('daily:daily-1:丹炉留痕:active');
    expect(html).toContain('眼前没有待办的破境卷宗');
    expect(html).not.toContain('已归卷宗');
  });

  it('shows the no-cultivator notice without trying to render task sections', () => {
    mockedUseCultivator.mockReturnValue({
      cultivator: null,
      isLoading: false,
    } as any);
    mockedUseTaskList.mockReturnValue({
      tasks: [],
      loading: false,
      error: undefined,
      reload: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(<TasksView />);

    expect(html).toContain('当前没有活跃角色，无法查看任务。');
    expect(html).not.toContain('今日日常');
  });

  it('shows request errors inline in the daily section', () => {
    mockedUseCultivator.mockReturnValue({
      cultivator: { id: 'cultivator-1' },
      isLoading: false,
    } as any);
    mockedUseTaskList.mockReturnValue({
      tasks: [],
      loading: false,
      error: '任务卷宗暂时失联',
      reload: vi.fn(),
    } as any);

    const html = renderToStaticMarkup(<TasksView />);

    expect(html).toContain('任务卷宗暂时失联');
  });
});
