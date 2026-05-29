import {
  YieldCalculator,
  YIELD_MATERIAL_QUALITY_CHANCE_BY_REALM,
} from './YieldCalculator';

describe('YieldCalculator', () => {
  it('ensures every realm quality map sums to 1', () => {
    for (const realm of Object.keys(
      YIELD_MATERIAL_QUALITY_CHANCE_BY_REALM,
    ) as Array<keyof typeof YIELD_MATERIAL_QUALITY_CHANCE_BY_REALM>) {
      const total = Object.values(
        YieldCalculator.getMaterialQualityChanceMap(realm),
      ).reduce((sum, chance) => sum + chance, 0);

      expect(total).toBeCloseTo(1, 10);
    }
  });

  it('blocks heaven immortal and divine materials for low realms', () => {
    for (const realm of ['炼气', '筑基'] as const) {
      const chanceMap = YieldCalculator.getMaterialQualityChanceMap(realm);
      expect(chanceMap.天品).toBe(0);
      expect(chanceMap.仙品).toBe(0);
      expect(chanceMap.神品).toBe(0);
    }
  });

  it('opens top-tier materials progressively by realm', () => {
    expect(YieldCalculator.getMaterialQualityChanceMap('金丹').天品).toBeGreaterThan(
      0,
    );
    expect(YieldCalculator.getMaterialQualityChanceMap('元婴').仙品).toBeGreaterThan(
      0,
    );
    expect(YieldCalculator.getMaterialQualityChanceMap('化神').神品).toBeGreaterThan(
      0,
    );
  });

  it('keeps heaven immortal and divine chances non-decreasing across realms', () => {
    const realms = Object.keys(
      YIELD_MATERIAL_QUALITY_CHANCE_BY_REALM,
    ) as Array<keyof typeof YIELD_MATERIAL_QUALITY_CHANCE_BY_REALM>;
    const trackedQualities = ['天品', '仙品', '神品'] as const;

    for (const quality of trackedQualities) {
      let previous = -1;
      for (const realm of realms) {
        const current = YieldCalculator.getMaterialQualityChanceMap(realm)[quality];
        expect(current).toBeGreaterThanOrEqual(previous);
        previous = current;
      }
    }
  });
});
