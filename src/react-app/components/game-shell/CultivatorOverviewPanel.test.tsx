import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { CultivatorOverviewPanel } from './CultivatorOverviewPanel';

vi.mock('@app/components/feature/cultivator/PersistentStatusesCard', () => ({
  CultivatorCurrentStatusSection: () => <div>当前状态分节</div>,
  CultivatorTrackSection: () => <div>炼体与洗髓分节</div>,
}));

vi.mock('@app/components/providers/InkUIProvider', () => ({
  useInkUI: () => ({
    pushToast: vi.fn(),
    openDialog: vi.fn(),
  }),
}));

vi.mock(
  '@shared/engine/battle-v5/adapters/CultivatorDisplayAdapter',
  () => ({
    getCultivatorDisplayAttributes: () => ({
      unit: {
        attributes: {
          getBaseValue: () => 10,
          getValue: () => 10,
        },
      },
    }),
  }),
);

vi.mock('@app/lib/contexts/CultivatorContext', () => ({
  useCultivator: () => ({
    cultivator: {
      id: 'cultivator-1',
      name: '林玄',
      realm: '炼气',
      realm_stage: '炼气九层',
      title: '玄霄子',
      age: 24,
      lifespan: 180,
      gender: '男',
      origin: '散修',
      personality: '寡言谨慎',
      background: '幼年流落山野，后得残卷入道。',
      balance_notes: '根基尚稳，宜守心神。',
      spiritual_roots: [],
      pre_heaven_fates: [],
      cultivations: [],
    },
    inventory: {
      artifacts: [],
    },
    skills: [],
    equipped: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    refreshCultivator: vi.fn(),
  }),
}));

describe('CultivatorOverviewPanel', () => {
  it('keeps the page focused on role details and the low-priority reincarnation action', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CultivatorOverviewPanel />
      </MemoryRouter>,
    );

    expect(html).toContain('道身概览');
    expect(html).toContain('林玄');
    expect(html).toContain('玄霄子');
    expect(html).toContain('修改');
    expect(html).toContain('洗髓');
    expect(html).toContain('0 / 100');
    expect(html).toContain('当前状态分节');
    expect(html).toContain('炼体与洗髓分节');
    expect(html).toContain('转世重修');
    expect(html).toContain('所修功法');
    expect(html).toContain('所修神通');

    expect(html).not.toContain('今日使用寿元');
    expect(html).not.toContain('灵石');
    expect(html).not.toContain('修为与感悟');
    expect(html).not.toContain('href="/game/skills"');
  });
});
