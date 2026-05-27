import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Consumable } from '@shared/types/cultivator';
import { ConsumablesTab } from './ConsumablesTab';

const healingPill: Consumable = {
  id: 'pill-heal',
  name: '回春丹',
  type: '丹药',
  quality: '玄品',
  quantity: 3,
  description: '旧说明：以多味灵草炼成，可缓缓修复伤势。',
  spec: {
    kind: 'pill',
    family: 'healing',
    operations: [
      { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
      { type: 'change_gauge', gauge: 'pillToxicity', delta: 4 },
      { type: 'remove_status', status: 'minor_wound' },
    ],
    consumeRules: {
      scene: 'out_of_battle_only',
      quotaCategory: 'none',
    },
    alchemyMeta: {
      source: 'improvised',
      sourceMaterials: ['回春草'],
      stability: 60,
      toxicityRating: 16,
      tags: ['healing'],
    },
  },
};

const cultivationPill: Consumable = {
  id: 'pill-cultivation',
  name: '养元丹',
  type: '丹药',
  quality: '真品',
  quantity: 1,
  description: '旧说明：炉火沉厚，可缓慢积蓄修为。',
  spec: {
    kind: 'pill',
    family: 'cultivation',
    operations: [
      { type: 'gain_progress', target: 'cultivation_exp', value: 498 },
      { type: 'change_gauge', gauge: 'pillToxicity', delta: 9 },
    ],
    consumeRules: {
      scene: 'out_of_battle_only',
      quotaCategory: 'cultivation',
    },
    alchemyMeta: {
      source: 'improvised',
      sourceMaterials: ['金霞芝'],
      stability: 72,
      toxicityRating: 18,
      tags: ['cultivation'],
    },
  },
};

describe('ConsumablesTab', () => {
  it('shows a structured pill summary instead of the raw long description', () => {
    const html = renderToStaticMarkup(
      <ConsumablesTab
        consumables={[healingPill]}
        realm="金丹"
        pendingId={null}
        onShowDetails={() => undefined}
        onConsume={() => undefined}
        onDiscard={() => undefined}
      />,
    );

    expect(html).toContain('恢复最大气血 12%');
    expect(html).toContain('疗伤');
    expect(html).toContain('丹毒 +4');
    expect(html).toContain('data-pill-keyword="疗伤"');
    expect(html).toContain('data-pill-keyword="丹毒 +4"');
    expect(html).not.toContain('旧说明：以多味灵草炼成');
    expect(html).not.toContain('仅可在场外服用');
    expect(html).not.toContain('服用上限');
  });

  it('shows cultivation pills with progress gain and the dedicated realm limit', () => {
    const html = renderToStaticMarkup(
      <ConsumablesTab
        consumables={[cultivationPill]}
        realm="金丹"
        pendingId={null}
        onShowDetails={() => undefined}
        onConsume={() => undefined}
        onDiscard={() => undefined}
      />,
    );

    expect(html).toContain('修为 +498');
    expect(html).toContain('服用上限 30 次');
    expect(html).toContain('data-pill-keyword="修为"');
    expect(html).not.toContain('旧说明：炉火沉厚');
  });
});
