const { objectArrayMock } = vi.hoisted(() => ({
  objectArrayMock: vi.fn(),
}));

vi.mock('@server/utils/aiClient', () => ({
  objectArray: objectArrayMock,
}));

import { MaterialGenerator } from '@shared/engine/material/creation/MaterialGenerator';
import type { MaterialSkeleton } from '@shared/engine/material/creation/types';

describe('MaterialGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes alchemyProfile when AI generation succeeds', async () => {
    objectArrayMock.mockResolvedValueOnce({
      object: [
        {
          name: '青岚草',
          description: '草叶清润，常用于温养经络与补益真息。',
          element: '木',
        },
      ],
    });

    const materials = await MaterialGenerator.generateFromSkeletons([
      { type: 'herb', rank: '真品', quantity: 1 } satisfies MaterialSkeleton,
    ]);

    expect(materials[0]?.details?.alchemyProfile).toMatchObject({
      effectTags: ['healing'],
      elementBias: '木',
      potency: 26,
      toxicity: 2,
    });
  });

  it('writes alchemyProfile when AI generation falls back to presets', async () => {
    objectArrayMock.mockRejectedValueOnce(new Error('boom'));

    const materials = await MaterialGenerator.generateFromSkeletons([
      { type: 'monster', rank: '真品', quantity: 1 } satisfies MaterialSkeleton,
    ]);

    expect(materials[0]?.details?.alchemyProfile).toMatchObject({
      effectTags: ['marrow_wash'],
      potency: 26,
      toxicity: 8,
    });
  });

  it('prefers qualityChanceMap over the global quality table', async () => {
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.95)
      .mockReturnValueOnce(0);
    objectArrayMock.mockResolvedValueOnce({
      object: [
        {
          name: '凝露砂',
          description: '砂粒细润，内藏微薄灵机。',
          element: '水',
        },
      ],
    });

    const materials = await MaterialGenerator.generateRandom(1, {
      specifiedType: 'ore',
      qualityChanceMap: {
        凡品: 0,
        灵品: 1,
        玄品: 0,
        真品: 0,
        地品: 0,
        天品: 0,
        仙品: 0,
        神品: 0,
      },
    });

    expect(materials[0]?.rank).toBe('灵品');
    randomSpy.mockRestore();
  });

  it('keeps rankRange behavior when no qualityChanceMap is provided', async () => {
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0);
    objectArrayMock.mockResolvedValueOnce({
      object: [
        {
          name: '镇岳石',
          description: '石纹厚重，常见于灵脉深处。',
          element: '土',
        },
      ],
    });

    const materials = await MaterialGenerator.generateRandom(1, {
      specifiedType: 'ore',
      rankRange: {
        min: '玄品',
        max: '地品',
      },
    });

    expect(materials[0]?.rank).toBe('地品');
    randomSpy.mockRestore();
  });
});
