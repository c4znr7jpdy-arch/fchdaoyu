import {
  buildMaterialAlchemyProfile,
  isAlchemyMaterialType,
} from '@shared/lib/materialAlchemy';
import type { Material } from '@shared/types/cultivator';
import { describe, expect, it } from 'vitest';
import { RewardFactory } from './RewardFactory';

describe('RewardFactory', () => {
  it('为副本产出的炼丹材料补齐药性画像', () => {
    const [reward] = RewardFactory.materialize(
      [
        {
          name: '青纹回元草',
          description: '木气温润的灵草，可调和炉势并稳住药力。',
          element: '木',
        },
      ],
      '筑基',
      'A',
      40,
    );

    expect(reward.type).toBe('material');

    const material = reward.data as Material;
    expect(isAlchemyMaterialType(material.type)).toBe(true);
    expect(material.details?.alchemyProfile).toBeDefined();

    if (!isAlchemyMaterialType(material.type) || !material.element) {
      throw new Error('expected alchemy material with element');
    }

    expect(material.details?.alchemyProfile).toEqual(
      buildMaterialAlchemyProfile(
        material.type,
        material.rank,
        material.element,
      ),
    );
  });

  it('为非炼丹材料保留空药性画像', () => {
    const [reward] = RewardFactory.materialize(
      [
        {
          name: '裂碑秘卷',
          description: '残缺秘术玉简，记有碎碑裂罡之法。',
          material_type: 'skill_manual',
          element: '金',
        },
      ],
      '筑基',
      'A',
      40,
    );

    expect(reward.type).toBe('material');

    const material = reward.data as Material;
    expect(material.type).toBe('skill_manual');
    expect(material.details).toBeUndefined();
  });
});
