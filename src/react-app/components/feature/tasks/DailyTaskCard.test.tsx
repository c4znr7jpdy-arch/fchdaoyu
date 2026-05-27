import type { TaskInstance } from '@shared/types/task';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DailyTaskCard } from './DailyTaskCard';

function createTask(overrides: Partial<TaskInstance> = {}): TaskInstance {
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
      stages: [
        {
          id: 'daily-alchemy-stage',
          title: '炼丹一次',
          description: '去炼丹房开炉一次，无论丹成何品，先把今日火候续上。',
          completionText: '丹炉已开，今日火候未断。',
          completed: false,
          current: true,
          links: [{ label: '去炼丹房', href: '/game/craft/alchemy' }],
          objectives: [
            {
              id: 'daily-alchemy-objective',
              kind: 'event_count',
              title: '完成 1 次炼丹',
              description: '成功完成一次炼丹即可。',
              completed: false,
              progressText: '0/1',
            },
          ],
        },
      ],
    },
  };
}

function renderCard(task: TaskInstance) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <DailyTaskCard task={task} />
    </MemoryRouter>,
  );
}

describe('DailyTaskCard', () => {
  it('renders progress, reward summary, and the reset hint for active tasks', () => {
    const html = renderCard(createTask());

    expect(html).toContain('丹炉留痕');
    expect(html).toContain('当前进度：0/1');
    expect(html).toContain('完成奖励：灵石 x300');
    expect(html).toContain('每日凌晨重置');
    expect(html).toContain('[去炼丹房]');
  });

  it('switches to the completed state without showing action buttons', () => {
    const html = renderCard(
      createTask({
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
          stages: [
            {
              id: 'daily-dungeon-stage',
              title: '完成探秘一次',
              description: '完成一次云游探秘结算，把今日见闻带回卷宗。',
              completionText: '外出一程，今日见闻已添一笔。',
              completed: true,
              current: false,
              links: [{ label: '去云游探秘', href: '/game/dungeon' }],
              objectives: [
                {
                  id: 'daily-dungeon-objective',
                  kind: 'event_count',
                  title: '完成 1 次探秘',
                  description: '完成一次探秘结算即可。',
                  completed: true,
                  progressText: '1/1',
                },
              ],
            },
          ],
        },
        metadata: {
          dailyKind: 'dungeon',
          resetKey: '2026-05-26',
          rewardSummary: ['灵石 x500'],
        },
      }),
    );

    expect(html).toContain('今日已成');
    expect(html).toContain('当前进度：1/1');
    expect(html).toContain('完成奖励：灵石 x500');
    expect(html).not.toContain('[去云游探秘]');
  });
});
