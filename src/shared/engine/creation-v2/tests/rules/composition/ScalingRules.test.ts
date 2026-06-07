import {
  DEFAULT_AFFIX_REGISTRY,
  flattenAffixMatcherTags,
} from '@shared/engine/creation-v2/affixes';
import { AffixEffectTranslator } from '@shared/engine/creation-v2/affixes/AffixEffectTranslator';
import type { AffixDefinition } from '@shared/engine/creation-v2/affixes/types';
import {
  AttributeType,
  ModifierType,
} from '@shared/engine/creation-v2/contracts/battle';
import { CompositionRuleSet } from '@shared/engine/creation-v2/rules/composition/CompositionRuleSet';
import type { CompositionFacts } from '@shared/engine/creation-v2/rules/contracts/CompositionFacts';
import type { RolledAffix } from '@shared/engine/creation-v2/types';
import { REALM_STAGE_CAPS } from '@shared/types/constants';
import { beforeEach, describe, expect, it } from 'vitest';

function toRolledAffix(def: AffixDefinition): RolledAffix {
  return {
    id: def.id,
    name: def.displayName,
    category: def.category,
    energyCost: def.energyCost,
    rollScore: 1,
    rollEfficiency: 1,
    finalMultiplier: 1,
    isPerfect: false,
    effectTemplate: def.effectTemplate,
    weight: def.weight,
    match: def.match,
    tags: flattenAffixMatcherTags(def.match),
    grantedAbilityTags: def.grantedAbilityTags,
    exclusiveGroup: def.exclusiveGroup,
  };
}

function buildFacts(qualityOrder: number): CompositionFacts {
  const skillCore = DEFAULT_AFFIX_REGISTRY.queryById('skill-core-damage');
  const quality = (
    ['凡品', '灵品', '玄品', '真品', '地品', '天品', '仙品', '神品'] as const
  )[qualityOrder];

  return {
    productType: 'skill',
    intent: {
      productType: 'skill',
      dominantTags: [],
      elementBias: '火',
    },
    recipeMatch: {
      recipeId: 'skill-default',
      valid: true,
      matchedTags: [],
      unlockedAffixCategories: [],
    },
    energySummary: {
      effectiveTotal: 30, // Some constant energy
      reserved: 3,
      startingAffixEnergy: 27,
      spentAffixEnergy: 8,
      remainingAffixEnergy: 19,
    },
    projectionQualityProfile: {
      quality,
      qualityOrder,
      basisEnergy: 30,
    },
    materialNames: ['测试材料'],
    affixes: skillCore ? [toRolledAffix(skillCore)] : [],
    inputTags: [],
    materialFingerprints: [],
  };
}

function buildArtifactFacts(
  qualityOrder: number,
  anchorRealm: '炼气' | '渡劫',
): CompositionFacts {
  const panelAtk = DEFAULT_AFFIX_REGISTRY.queryById('artifact-panel-atk');
  const quality = (
    ['凡品', '灵品', '玄品', '真品', '地品', '天品', '仙品', '神品'] as const
  )[qualityOrder];

  return {
    productType: 'artifact',
    intent: {
      productType: 'artifact',
      dominantTags: [],
      elementBias: '金',
      slotBias: 'weapon',
    },
    recipeMatch: {
      recipeId: 'artifact-default',
      valid: true,
      matchedTags: [],
      unlockedAffixCategories: [],
    },
    energySummary: {
      effectiveTotal: 30,
      reserved: 3,
      startingAffixEnergy: 27,
      spentAffixEnergy: 8,
      remainingAffixEnergy: 19,
    },
    projectionQualityProfile: {
      quality,
      qualityOrder,
      basisEnergy: 30,
    },
    materialNames: ['测试材料'],
    affixes: panelAtk ? [toRolledAffix(panelAtk)] : [],
    inputTags: [],
    materialFingerprints: [],
    anchorRealm,
    anchorRealmStage: '圆满',
  };
}

describe('ScalingRules (mpCost and cooldown)', () => {
  let ruleSet: CompositionRuleSet;

  beforeEach(() => {
    ruleSet = new CompositionRuleSet(DEFAULT_AFFIX_REGISTRY);
  });

  it('mpCost 应随品质线性增长，不再指数级放大', () => {
    const decision0 = ruleSet.evaluate(buildFacts(0));
    expect((decision0.projectionPolicy as any).mpCost).toBe(100);

    const decision1 = ruleSet.evaluate(buildFacts(1));
    expect((decision1.projectionPolicy as any).mpCost).toBe(120);

    const decision7 = ruleSet.evaluate(buildFacts(7));
    expect((decision7.projectionPolicy as any).mpCost).toBe(270);
  });

  it('cooldown 应随品质压力温和增长并限制在职责区间内', () => {
    const decision0 = ruleSet.evaluate(buildFacts(0));
    expect((decision0.projectionPolicy as any).cooldown).toBe(2);

    const decision3 = ruleSet.evaluate(buildFacts(3));
    expect((decision3.projectionPolicy as any).cooldown).toBe(3);

    const decision7 = ruleSet.evaluate(buildFacts(7));
    expect((decision7.projectionPolicy as any).cooldown).toBe(4);
  });

  it('治疗技能使用 sustain 职责区间', () => {
    const healCore = DEFAULT_AFFIX_REGISTRY.queryById('skill-core-heal');
    const facts = buildFacts(7);
    if (healCore) facts.affixes = [toRolledAffix(healCore)];

    const decision = ruleSet.evaluate(facts);
    expect((decision.projectionPolicy as any).cooldown).toBe(5);
  });

  it('self buff core 应投影为 self target 的主动技能', () => {
    const buffCore = DEFAULT_AFFIX_REGISTRY.queryById(
      'skill-core-fire-channeling',
    );
    const facts = buildFacts(0);
    if (buffCore) facts.affixes = [toRolledAffix(buffCore)];

    const decision = ruleSet.evaluate(facts);
    expect((decision.projectionPolicy as any).targetPolicy).toEqual({
      team: 'self',
      scope: 'single',
    });
    expect((decision.projectionPolicy as any).cooldown).toBe(3);
  });

  it('复合词缀会提高冷却和蓝耗，但仍保持封顶', () => {
    const burn = DEFAULT_AFFIX_REGISTRY.queryById('skill-variant-burn-dot');
    const stun = DEFAULT_AFFIX_REGISTRY.queryById('skill-variant-control-stun');
    const facts = buildFacts(7);
    facts.affixes = [
      ...facts.affixes,
      ...(burn ? [toRolledAffix(burn)] : []),
      ...(stun ? [toRolledAffix(stun)] : []),
    ];

    const decision = ruleSet.evaluate(facts);
    expect((decision.projectionPolicy as any).cooldown).toBe(5);
    expect((decision.projectionPolicy as any).mpCost).toBe(300);
  });

  it('显式 control 职责的伤害+控制复合技能仍会增加冷却', () => {
    const stun = DEFAULT_AFFIX_REGISTRY.queryById('skill-variant-control-stun');
    const facts = buildFacts(0);
    facts.affixes = [
      ...facts.affixes,
      ...(stun ? [toRolledAffix(stun)] : []),
    ];
    facts.projectionContext = {
      ownerKind: 'player',
      role: 'control',
    };

    const decision = ruleSet.evaluate(facts);
    expect((decision.projectionPolicy as any).cooldown).toBe(3);
  });

  it('敌人技能蓝耗应按 estimatedMaxMp 归一化', () => {
    const facts = buildFacts(3);
    facts.projectionContext = {
      ownerKind: 'enemy',
      difficulty: 85,
      role: 'offense',
      estimatedMaxMp: 1200,
      paceProfile: 'aggressive',
    };

    const decision = ruleSet.evaluate(facts);
    expect((decision.projectionPolicy as any).mpCost).toBe(140);
    expect((decision.projectionPolicy as any).cooldown).toBe(3);
  });

  it('artifact 主面板 fixed 应按锚定境界成长', () => {
    const lowAnchorDecision = ruleSet.evaluate(buildArtifactFacts(7, '炼气'));
    const highAnchorDecision = ruleSet.evaluate(buildArtifactFacts(7, '渡劫'));

    const lowValue = (lowAnchorDecision.projectionPolicy as any).modifiers.find(
      (m: any) =>
        m.attrType === AttributeType.ATK && m.type === ModifierType.FIXED,
    )?.value;
    const highValue = (
      highAnchorDecision.projectionPolicy as any
    ).modifiers.find(
      (m: any) =>
        m.attrType === AttributeType.ATK && m.type === ModifierType.FIXED,
    )?.value;

    const def = DEFAULT_AFFIX_REGISTRY.queryById('artifact-panel-atk');
    expect(def).toBeDefined();
    const translator = new AffixEffectTranslator();
    const template = def!.effectTemplate;
    expect(template.type).toBe('attribute_modifier');
    const baseByQuality = translator.resolveParam(
      (template as any).params.value,
      7,
      1.0,
    );
    const lowFactor = Math.pow(REALM_STAGE_CAPS['炼气']['圆满'] / 20, 0.45);
    const highFactor = Math.pow(REALM_STAGE_CAPS['渡劫']['圆满'] / 20, 0.45);

    expect(lowValue).toBeCloseTo(baseByQuality * lowFactor, 6);
    expect(highValue).toBeCloseTo(baseByQuality * highFactor, 6);
    expect(highValue).toBeGreaterThan(lowValue);
  });
});
