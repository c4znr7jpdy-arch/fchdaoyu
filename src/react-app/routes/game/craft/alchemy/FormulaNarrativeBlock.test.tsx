import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { AlchemyFormula } from '@shared/types/consumable';
import { FormulaNarrativeBlock } from './route';

const formula: AlchemyFormula = {
  id: 'formula-1',
  cultivatorId: 'cultivator-1',
  name: '回春丹方',
  description: '此方偏走木性生机，炉势圆融而不躁进。',
  family: 'healing',
  pattern: {
    requiredTags: ['healing'],
    optionalTags: ['mana'],
    dominantElement: '木',
    minQuality: '真品',
    slotCount: 2,
  },
  blueprint: {
    operations: [
      { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
    ],
    consumeRules: {
      scene: 'out_of_battle_only',
      countsTowardLongTermQuota: false,
    },
    targetStability: 78,
    targetToxicity: 6,
  },
  mastery: {
    level: 2,
    exp: 4,
  },
  createdAt: '2026-05-15T00:00:00.000Z',
  updatedAt: '2026-05-15T00:00:00.000Z',
};

describe('FormulaNarrativeBlock', () => {
  it('shows formula description before supporting rule metadata', () => {
    const html = renderToStaticMarkup(<FormulaNarrativeBlock formula={formula} />);

    expect(html).toContain('此方偏走木性生机，炉势圆融而不躁进。');
    expect(html).toContain('核心药性：疗伤');
    expect(html).toContain('炉位 2 种，最低 真品，主元素 木');
    expect(html).toContain('辅性药性：回元');
    expect(html.indexOf('此方偏走木性生机，炉势圆融而不躁进。')).toBeLessThan(
      html.indexOf('核心药性：疗伤'),
    );
  });

  it('can include mastery progress in the selected-formula summary variant', () => {
    const html = renderToStaticMarkup(
      <FormulaNarrativeBlock formula={formula} showMasteryExp />,
    );

    expect(html).toContain('当前熟练进度 4');
  });
});
