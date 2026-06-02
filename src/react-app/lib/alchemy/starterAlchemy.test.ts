import { describe, expect, it } from 'vitest';
import { selectRecommendedStarterAlchemyMaterials } from './starterAlchemy';
import type { Material } from '@shared/types/cultivator';

function material(name: string, quantity = 1): Material {
  return {
    id: `material-${name}`,
    name,
    type: 'herb',
    rank: '凡品',
    element: '木',
    quantity,
  };
}

describe('selectRecommendedStarterAlchemyMaterials', () => {
  it('selects qinglu grass and ningshui flower with one dose each', () => {
    const result = selectRecommendedStarterAlchemyMaterials(
      [material('青露草', 3), material('凝水花', 2), material('赤芽果', 2)],
      1,
    );

    expect(result.missingNames).toEqual([]);
    expect(result.selectedIds).toEqual(['material-青露草', 'material-凝水花']);
    expect(result.doseMap).toEqual({
      'material-青露草': 1,
      'material-凝水花': 1,
    });
  });

  it('reports missing starter materials', () => {
    const result = selectRecommendedStarterAlchemyMaterials(
      [material('青露草', 0)],
      1,
    );

    expect(result.selectedIds).toEqual([]);
    expect(result.missingNames).toEqual(['青露草', '凝水花']);
  });
});
