import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RankingListItem } from './RankingListItem';

describe('RankingListItem', () => {
  it('shows structured pill effects for elixir ranking entries', () => {
    const html = renderToStaticMarkup(
      <RankingListItem
        item={{
          id: 'pill-rank-1',
          rank: 2,
          name: '凝神破境丹',
          itemType: 'elixir',
          type: '丹药',
          quality: '真品',
          ownerName: '林玄',
          score: 920,
          description: '旧说明：丹意沉静，可助冲关。',
          quantity: 1,
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
              sourceMaterials: ['凝心芝'],
              stability: 82,
              toxicityRating: 36,
              tags: ['breakthrough'],
            },
          },
        }}
        isSelf={false}
        canChallenge={false}
        isChallenging={false}
        isProbing={false}
        onChallenge={async () => undefined}
        onProbe={async () => undefined}
        isItem
        viewerRealm="金丹"
        onViewDetails={() => undefined}
      />,
    );

    expect(html).toContain('获得「破境凝神」');
    expect(html).toContain('服用上限 10 次');
    expect(html).toContain('丹毒 +12');
    expect(html).toContain('持有者: 林玄');
    expect(html).not.toContain('旧说明：丹意沉静');
    expect(html).not.toContain('breakthrough_focus');
  });
});
