import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Consumable } from '@shared/types/cultivator';
import { ItemDetailModal } from './ItemDetailModal';

vi.mock('@app/components/layout', () => ({
  InkModal: ({
    isOpen,
    children,
    footer,
  }: {
    isOpen: boolean;
    children: ReactNode;
    footer?: ReactNode;
  }) => (isOpen ? <div>{children}{footer}</div> : null),
}));

const breakthroughPill: Consumable = {
  id: 'pill-breakthrough',
  name: '凝神破境丹',
  type: '丹药',
  quality: '真品',
  quantity: 1,
  description: '丹成评述：此丹重在稳神定魄，适宜冲关前服下。',
  spec: {
    kind: 'pill',
    family: 'breakthrough',
    operations: [
      { type: 'add_status', status: 'breakthrough_focus', usesRemaining: 1 },
      { type: 'change_gauge', gauge: 'pillToxicity', delta: 12 },
    ],
    consumeRules: {
      scene: 'out_of_battle_only',
      countsTowardLongTermQuota: true,
    },
    alchemyMeta: {
      source: 'formula',
      formulaId: 'formula-1',
      sourceMaterials: ['凝心芝', '定魄砂'],
      dominantElement: '火',
      stability: 82,
      toxicityRating: 36,
      tags: ['breakthrough'],
    },
  },
};

describe('ItemDetailModal', () => {
  it('renders structured pill detail groups and keeps flavor text as a secondary section', () => {
    const html = renderToStaticMarkup(
      <ItemDetailModal
        isOpen
        onClose={() => undefined}
        item={{ kind: 'consumable', item: breakthroughPill }}
        viewerRealm="金丹"
      />,
    );

    expect(html).toContain('获得「破境凝神」');
    expect(html).toContain('核心药效');
    expect(html).toContain('代价与规则');
    expect(html).toContain('炼制信息');
    expect(html).toContain('丹成评述');
    expect(html).toContain('服用上限：10 次');
    expect(html).toContain('炼制来源：丹方炼制');
    expect(html).toContain('主元素：火');
    expect(html).not.toContain('breakthrough_focus');
    expect(html.indexOf('核心药效')).toBeLessThan(html.indexOf('丹成评述'));
    expect(html.split('获得「破境凝神」').length - 1).toBe(1);
  });
});
