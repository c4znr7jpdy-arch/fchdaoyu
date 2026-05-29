import type { AlchemyFormula } from '@shared/types/consumable';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  AlchemyFormulaListItem,
  AlchemyFormulaSummaryCard,
  getNextSelectedFormulaIdAfterDelete,
} from './route';

const summaryFormula: AlchemyFormula = {
  id: 'formula-1',
  cultivatorId: 'cultivator-1',
  name: '回春丹丹方',
  description: '以回元草为引，辅以木行温养之材，可稳固疗伤药脉。',
  family: 'healing',
  pattern: {
    targetPropertyVector: [
      { key: 'restore_hp', weight: 0.62 },
      { key: 'heal_wounds', weight: 0.38 },
    ],
    dominantElement: '木',
    minQuality: '真品',
    slotCount: 2,
  },
  blueprint: {
    operations: [],
    consumeRules: {
      scene: 'out_of_battle_only',
      quotaCategory: 'none',
    },
    targetStability: 72,
    targetToxicity: 8,
  },
  mastery: {
    level: 2,
    exp: 3,
  },
  createdAt: '2026-05-15T00:00:00.000Z',
  updatedAt: '2026-05-15T00:00:00.000Z',
};

describe('alchemy formula delete helpers', () => {
  it('renders the formula list item with a dedicated delete action', () => {
    const html = renderToStaticMarkup(
      <AlchemyFormulaListItem
        formula={summaryFormula}
        isActive={false}
        isDeleting={false}
        onSelect={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(html).toContain('回春丹丹方');
    expect(html).toContain('删除');
    expect(html).toContain('Lv.2');
    expect(html).toContain('w-[7em]');
  });

  it('keeps the delete button width stable while deleting', () => {
    const html = renderToStaticMarkup(
      <AlchemyFormulaListItem
        formula={summaryFormula}
        isActive={false}
        isDeleting
        onSelect={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(html).toContain('删除中……');
    expect(html).toContain('w-[7em]');
  });

  it('keeps the summary card focused on formula details without duplicate delete action', () => {
    const html = renderToStaticMarkup(
      <AlchemyFormulaSummaryCard formula={summaryFormula} />,
    );

    expect(html).toContain('回春丹丹方');
    expect(html).toContain('当前熟练进度 3');
    expect(html).not.toContain('删除丹方');
  });

  it('picks the next available formula after deleting the current selection', () => {
    const nextSelectedFormulaId = getNextSelectedFormulaIdAfterDelete(
      [
        summaryFormula,
        {
          ...summaryFormula,
          id: 'formula-2',
          name: '养元丹丹方',
        },
      ],
      'formula-1',
      'formula-1',
    );

    expect(nextSelectedFormulaId).toBe('formula-2');
  });

  it('clears selection when the deleted formula was the last remaining one', () => {
    expect(
      getNextSelectedFormulaIdAfterDelete(
        [summaryFormula],
        'formula-1',
        'formula-1',
      ),
    ).toBeNull();
  });
});
