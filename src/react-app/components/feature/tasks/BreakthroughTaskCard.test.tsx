import type { TaskInstance } from '@shared/types/task';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BreakthroughTaskCard } from './BreakthroughTaskCard';

function createTask(overrides: Partial<TaskInstance> = {}): TaskInstance {
  return {
    id: overrides.id ?? 'task-1',
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
      stages: [
        {
          id: 'foundation-pill',
          title: '备筑基丹',
          description: '先炼出一枚足以稳住药力的筑基丹，为液化灵气做准备。',
          completionText: '筑基丹已备妥，药力可引灵气归府。',
          completed: false,
          current: true,
          links: [
            { label: '去炼丹房', href: '/game/craft/alchemy' },
            { label: '看任务中心', href: '/game/tasks' },
          ],
          objectives: [
            {
              id: 'craft-pill',
              kind: 'craft_breakthrough_pill',
              title: '炼出筑基丹',
              description: '以破境丹炉意炼出可用于筑基的大丹。',
              completed: false,
              progressText: '尚未炼成',
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
      <BreakthroughTaskCard task={task} />
    </MemoryRouter>,
  );
}

describe('BreakthroughTaskCard', () => {
  it('puts the current stage ahead of the dossier title for active tasks', () => {
    const html = renderCard(createTask());

    expect(html).toContain('备筑基丹');
    expect(html).toContain('筑基前引');
    expect(html).toContain('先炼出一枚足以稳住药力的筑基丹');
    expect(html.indexOf('备筑基丹')).toBeLessThan(html.indexOf('筑基前引'));
  });

  it('renders completed tasks as a return-to-retreat result card', () => {
    const html = renderCard(
      createTask({
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
          stages: [
            {
              id: 'foundation-pill',
              title: '备筑基丹',
              description: '先炼出一枚足以稳住药力的筑基丹，为液化灵气做准备。',
              completionText: '筑基丹已备妥，药力可引灵气归府。',
              completed: true,
              current: false,
              links: [],
              objectives: [],
            },
          ],
        },
      }),
    );

    expect(html).toContain('可回静室冲关');
    expect(html).toContain('现在可以回静室正式冲击筑基');
    expect(html).toContain('[回静室冲关]');
  });

  it('keeps the current stage action links visible on active cards', () => {
    const html = renderCard(createTask());

    expect(html).toContain('[去炼丹房]');
    expect(html).toContain('[看任务中心]');
  });
});
