import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type {
  AlchemyFormulaDiscoveryCandidate,
} from '@shared/types/consumable';
import type { Consumable } from '@shared/types/cultivator';
import {
  AlchemyFormulaDiscoveryModal,
  AlchemyGuideModal,
  AlchemyResultModal,
} from './route';

vi.mock('@app/components/layout', () => ({
  InkModal: ({
    isOpen,
    title,
    children,
    footer,
  }: {
    isOpen: boolean;
    title?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
  }) => (isOpen ? <div>{title}{children}{footer}</div> : null),
}));

const craftedPill: Consumable = {
  id: 'pill-1',
  name: '回春丹',
  type: '丹药',
  quality: '真品',
  quantity: 2,
  description: '丹成后药香回转，适合疗伤稳息。',
  spec: {
    kind: 'pill',
    family: 'healing',
    operations: [
      { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.2 },
      { type: 'change_gauge', gauge: 'pillToxicity', delta: 8 },
    ],
    consumeRules: {
      scene: 'out_of_battle_only',
      quotaCategory: 'none',
    },
    alchemyMeta: {
      source: 'improvised',
      sourceMaterials: ['青木芝', '回元草'],
      dominantElement: '木',
      stability: 78,
      toxicityRating: 18,
      tags: ['healing'],
    },
  },
};

const discoveredFormula: AlchemyFormulaDiscoveryCandidate = {
  token: 'token-1',
  name: '回春丹丹方',
  description: '以回元草为引，辅以木行温养之材，可稳固疗伤药脉。',
  family: 'healing',
  discoveryRemark: '炉中药脉忽然成章，你隐约看清了留方路径。',
  patternSummary: '主药性：疗伤；炉位：2 种材料；主元素：木',
};

describe('alchemy result modals', () => {
  it('keeps the crafted-pill modal focused on成丹信息', () => {
    const html = renderToStaticMarkup(
      <AlchemyResultModal
        consumable={craftedPill}
        formulaProgress={{
          previousLevel: 1,
          level: 2,
          exp: 12,
          gainedExp: 5,
          leveledUp: true,
        }}
        isOpen
        onClose={() => undefined}
        viewerRealm="筑基"
      />,
    );

    expect(html).toContain('回春丹');
    expect(html).toContain('丹成评述');
    expect(html).toContain('丹方熟练');
    expect(html).not.toContain('保存丹方');
    expect(html).not.toContain('回春丹丹方');
  });

  it('renders formula discovery as a separate follow-up modal', () => {
    const html = renderToStaticMarkup(
      <AlchemyFormulaDiscoveryModal
        formulaDiscovery={discoveredFormula}
        isHandlingDiscovery={false}
        isOpen
        onAcceptDiscovery={() => undefined}
        onRejectDiscovery={() => undefined}
      />,
    );

    expect(html).toContain('回春丹丹方');
    expect(html).toContain('新悟丹方');
    expect(html).toContain('炉中药脉忽然成章');
    expect(html).toContain('留方记述');
    expect(html).toContain('保存丹方');
    expect(html).toContain('暂不保存');
  });

  it('renders the alchemy guide modal with three implicit guidance sections', () => {
    const html = renderToStaticMarkup(
      <AlchemyGuideModal isOpen onClose={() => undefined} />,
    );

    expect(html).toContain('炉理指引');
    expect(html).toContain('药路趋向');
    expect(html).toContain('材性偏向');
    expect(html).toContain('炉火提醒');
    expect(html).not.toContain('1.5');
    expect(html).not.toContain('0.8');
  });
});
