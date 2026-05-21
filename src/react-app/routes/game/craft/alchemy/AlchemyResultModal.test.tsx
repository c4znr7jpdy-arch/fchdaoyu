import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Consumable } from '@shared/types/cultivator';
import { AlchemyResultModal } from './route';

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

const craftedPill: Consumable = {
  id: 'pill-formula',
  name: '回春丹',
  type: '丹药',
  quality: '玄品',
  quantity: 1,
  description: '丹成评述：火候圆融，药气温润。',
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
      countsTowardLongTermQuota: false,
    },
    alchemyMeta: {
      source: 'formula',
      formulaId: 'formula-1',
      sourceMaterials: ['回春草', '木灵脂'],
      dominantElement: '木',
      stability: 78,
      toxicityRating: 20,
      tags: ['healing'],
    },
  },
};

describe('AlchemyResultModal', () => {
  it('reuses the structured pill sections and keeps mastery/discovery footer content', () => {
    const html = renderToStaticMarkup(
      <AlchemyResultModal
        consumable={craftedPill}
        formulaDiscovery={{
          token: 'token-1',
          name: '回春丹方',
          description: '此方偏走木性生机，炉势圆融而不躁进。',
          family: 'healing',
          discoveryRemark: '炉中药意已渐成章，回春一路可暂留于册。',
          patternSummary: '以木性生机为主，辅以回春药意。',
        }}
        formulaProgress={{
          previousLevel: 1,
          level: 2,
          exp: 30,
          gainedExp: 12,
          leveledUp: true,
        }}
        isHandlingDiscovery={false}
        isOpen
        onAcceptDiscovery={() => undefined}
        onClose={() => undefined}
        onRejectDiscovery={() => undefined}
        viewerRealm="金丹"
      />,
    );

    expect(html).toContain('恢复最大气血 12%');
    expect(html).toContain('核心药效');
    expect(html).toContain('代价与规则');
    expect(html).toContain('炼制信息');
    expect(html).not.toContain('服用上限');
    expect(html).toContain('丹方熟练');
    expect(html).toContain('本次熟练 +12');
    expect(html).toContain('炉中药意已渐成章，回春一路可暂留于册。');
    expect(html).toContain('回春丹方');
    expect(html).toContain('此方偏走木性生机，炉势圆融而不躁进。');
    expect(html).toContain('丹成评述');
    expect(html.indexOf('核心药效')).toBeLessThan(html.indexOf('丹方熟练'));
  });
});
