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
      targetTags: ['healing'],
      operations: [
        { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
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
      targetTags: ['healing', 'mana'],
      operations: [
        { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
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
        targetTagsText: '疗伤、回元',
        stabilityText: '78',
        toxicityText: '6',
        userPromptText: '疗伤为主，兼顾回元',
        focusModeText: '调和并济',
      }),
    );
  });

  it('builds minimal, readable formula batch prompt variables', () => {
    const enricher = new AlchemyNarrativeEnricher({ enabled: true });

    const variables = (enricher as any).buildFormulaBatchVariables({
      formulaName: '回春丹方',
      formulaDescription: '此方偏走木性生机，炉势圆融而不躁进。',
      family: 'healing',
      dominantElement: '木',
      quality: '玄品',
      materialNames: ['回春草', '木灵脂'],
      operations: [
        { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
        { type: 'remove_status', status: 'minor_wound' },
      ],
      fitMultiplier: 1.08,
      stability: 81,
      toxicityRating: 5,
      masteryLevel: 3,
    });

    expect(variables).toEqual({
      formulaNameText: '回春丹方',
      formulaDescriptionText: '此方偏走木性生机，炉势圆融而不躁进。',
      familyText: '疗伤丹',
      qualityText: '玄品',
      elementText: '木',
      materialsText: '回春草、木灵脂',
      operationLinesText: '- 恢复最大气血 12%\n- 化解「轻伤」',
      fitPercentText: '108%',
      stabilityText: '81',
      toxicityText: '5',
      masteryLevelText: '3',
    });
  });

  it('returns null when llm generation throws', async () => {
    objectMock.mockRejectedValueOnce(new Error('timeout'));
    const enricher = new AlchemyNarrativeEnricher({ enabled: true });

    const result = await enricher.generateFormulaRecordCopy({
      fallbackName: '回春丹方',
      sourcePillName: '回春丹',
      sourcePillDescription: '丹成时木气圆融，药香沉静。',
      family: 'healing',
      dominantElement: '木',
      minQuality: '真品',
      slotCount: 2,
      materialNames: ['回春草', '木灵脂'],
      requiredTags: ['healing'],
      optionalTags: ['mana'],
      operations: [
        { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
      ],
      targetStability: 78,
      targetToxicity: 6,
      userPrompt: '疗伤为主',
    });

    expect(result).toBeNull();
  });
});
