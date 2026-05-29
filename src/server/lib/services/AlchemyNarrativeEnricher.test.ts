const { objectMock, renderPromptMock } = vi.hoisted(() => ({
  objectMock: vi.fn(),
  renderPromptMock: vi.fn(() => ({ system: 'system', user: 'user' })),
}));

vi.mock('@server/lib/prompts', () => ({
  renderPrompt: renderPromptMock,
}));

vi.mock('@server/utils/aiClient', () => ({
  object: objectMock,
}));

import { describe, expect, it, vi } from 'vitest';
import { AlchemyNarrativeEnricher } from './AlchemyNarrativeEnricher';

describe('AlchemyNarrativeEnricher', () => {
  beforeEach(() => {
    objectMock.mockReset();
    renderPromptMock.mockClear();
    renderPromptMock.mockReturnValue({ system: 'system', user: 'user' });
  });

  it('returns null when disabled', async () => {
    const enricher = new AlchemyNarrativeEnricher({ enabled: false });

    const result = await enricher.generateImprovisedPillCopy({
      family: 'healing',
      dominantElement: '木',
      quality: '真品',
      materialNames: ['青岚草'],
      propertyVector: [{ key: 'restore_hp', weight: 0.7 }],
      operations: [
        {
          type: 'restore_resource',
          resource: 'hp',
          mode: 'percent',
          value: 0.12,
        },
      ],
      stability: 78,
      toxicityRating: 6,
      userPrompt: '疗伤为主',
      focusMode: 'focused',
    });

    expect(result).toBeNull();
    expect(objectMock).not.toHaveBeenCalled();
  });

  it('returns structured improvised pill copy on success', async () => {
    objectMock.mockResolvedValueOnce({
      object: {
        name: '回春散',
        description: '炉中木气温和归拢，药香沉稳，服后自有一线生机回护脉络。',
        styleInsight: '抓住了木性回春与缓和炉势',
      },
    });
    const enricher = new AlchemyNarrativeEnricher({ enabled: true });

    const result = await enricher.generateImprovisedPillCopy({
      family: 'healing',
      dominantElement: '木',
      quality: '真品',
      materialNames: ['青岚草', '灵泉露'],
      propertyVector: [
        { key: 'restore_hp', weight: 0.58 },
        { key: 'restore_mp', weight: 0.42 },
      ],
      operations: [
        {
          type: 'restore_resource',
          resource: 'hp',
          mode: 'percent',
          value: 0.12,
        },
        { type: 'change_gauge', gauge: 'pillToxicity', delta: 4 },
      ],
      stability: 78,
      toxicityRating: 6,
      userPrompt: '疗伤为主，兼顾回元',
      focusMode: 'balanced',
    });

    expect(result).toEqual({
      name: '回春散',
      description: '炉中木气温和归拢，药香沉稳，服后自有一线生机回护脉络。',
      styleInsight: '抓住了木性回春与缓和炉势',
    });
    expect(renderPromptMock).toHaveBeenCalledWith(
      'alchemy-improvised-copy',
      expect.objectContaining({
        familyText: '疗伤丹',
        qualityText: '真品',
        elementText: '木',
        materialsText: '青岚草、灵泉露',
        propertyVectorText: '补充气血 58%、回补法力 42%',
        stabilityText: '78',
        toxicityText: '6',
        userPromptText: '疗伤为主，兼顾回元',
        focusModeText: '调和并济',
      }),
    );
  });

  it('returns null when llm generation throws', async () => {
    objectMock.mockRejectedValueOnce(new Error('timeout'));
    const enricher = new AlchemyNarrativeEnricher({ enabled: true });

    const result = await enricher.generateImprovisedPillCopy({
      family: 'healing',
      dominantElement: '木',
      quality: '真品',
      materialNames: ['回春草', '木灵脂'],
      propertyVector: [
        { key: 'restore_hp', weight: 0.64 },
        { key: 'heal_wounds', weight: 0.36 },
      ],
      operations: [
        {
          type: 'restore_resource',
          resource: 'hp',
          mode: 'percent',
          value: 0.12,
        },
      ],
      stability: 78,
      toxicityRating: 6,
      userPrompt: '疗伤为主',
      focusMode: 'focused',
    });

    expect(result).toBeNull();
  });
});
