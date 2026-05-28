import { ELEMENT_VALUES, QUALITY_VALUES } from '@shared/types/constants';
import {
  buildMaterialAlchemyProfile,
  resolveMaterialAlchemyProfile,
} from './materialAlchemy';

describe('buildMaterialAlchemyProfile', () => {
  it('builds valid profiles for every alchemy material type, quality, and element', () => {
    const materialTypes = ['herb', 'ore', 'monster', 'tcdb', 'aux'] as const;

    for (const type of materialTypes) {
      for (const quality of QUALITY_VALUES) {
        for (const element of ELEMENT_VALUES) {
          const profile = buildMaterialAlchemyProfile(type, quality, element);

          expect(profile.effectTags.length).toBeGreaterThan(0);
          expect(profile.potency).toBeGreaterThan(0);
          expect(profile.toxicity).toBeGreaterThanOrEqual(0);
          expect(profile.stability).toBeGreaterThanOrEqual(0);
          expect(profile.stability).toBeLessThanOrEqual(100);
          expect(profile.elementBias).toBe(element);
        }
      }
    }
  });

  it('maps herb wind materials to mana plus detox', () => {
    const profile = buildMaterialAlchemyProfile('herb', '真品', '风');
    expect(profile.effectTags).toEqual(['mana', 'detox']);
  });

  it('lets herb gold materials accumulate cultivation direction', () => {
    const profile = buildMaterialAlchemyProfile('herb', '真品', '金');
    expect(profile.effectTags).toEqual(['mana', 'cultivation']);
  });

  it('maps ore thunder materials to willpower tempering', () => {
    const profile = buildMaterialAlchemyProfile('ore', '真品', '雷');
    expect(profile.effectTags).toEqual(['tempering_willpower']);
  });

  it('lets ore ice materials carry insight direction alongside tempering', () => {
    const profile = buildMaterialAlchemyProfile('ore', '真品', '冰');
    expect(profile.effectTags).toEqual(['tempering_wisdom', 'insight']);
  });

  it('maps monster wood materials to spirit tempering', () => {
    const profile = buildMaterialAlchemyProfile('monster', '真品', '木');
    expect(profile.effectTags).toEqual(['tempering_spirit']);
  });

  it('maps tcdb wind materials to healing plus mana', () => {
    const profile = buildMaterialAlchemyProfile('tcdb', '真品', '风');
    expect(profile.effectTags).toEqual(['healing', 'mana']);
  });

  it('lets aux ice materials carry both detox and insight direction', () => {
    const profile = buildMaterialAlchemyProfile('aux', '真品', '冰');
    expect(profile.effectTags).toEqual(['detox', 'insight']);
  });

  it('falls back to a derived profile when stored details are missing', () => {
    const profile = resolveMaterialAlchemyProfile({
      type: 'herb',
      rank: '真品',
      element: '木',
    });

    expect(profile).toEqual(buildMaterialAlchemyProfile('herb', '真品', '木'));
  });

  it('prefers the stored profile when details already provide one', () => {
    const storedProfile = buildMaterialAlchemyProfile('ore', '灵品', '雷');
    const profile = resolveMaterialAlchemyProfile({
      type: 'ore',
      rank: '真品',
      element: '木',
      details: {
        alchemyProfile: storedProfile,
      },
    });

    expect(profile).toEqual(storedProfile);
  });
});
