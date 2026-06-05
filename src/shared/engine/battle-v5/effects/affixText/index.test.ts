import {
  DEFAULT_AFFIX_REGISTRY,
  flattenAffixMatcherTags,
} from '@shared/engine/creation-v2/affixes';
import type { AffixDefinition } from '@shared/engine/creation-v2/affixes/types';
import type { RolledAffix } from '@shared/engine/creation-v2/types';
import { renderAffixMechanic } from './index';
import { describe, expect, it } from 'vitest';

function toRolledAffix(def: AffixDefinition): RolledAffix {
  return {
    id: def.id,
    name: def.displayName,
    description: def.displayDescription,
    category: def.category,
    match: def.match,
    tags: flattenAffixMatcherTags(def.match),
    grantedAbilityTags: def.grantedAbilityTags,
    weight: def.weight,
    energyCost: def.energyCost,
    exclusiveGroup: def.exclusiveGroup,
    applicableArtifactSlots: def.applicableArtifactSlots,
    targetPolicyConstraint: def.targetPolicyConstraint,
    selectionMeta: def.selectionMeta,
    effectTemplate: def.effectTemplate,
    rollScore: 1,
    rollEfficiency: 1,
    finalMultiplier: 1,
    isPerfect: false,
  };
}

function renderAffix(affixId: string) {
  const def = DEFAULT_AFFIX_REGISTRY.queryById(affixId);
  if (!def) throw new Error(`missing test affix: ${affixId}`);
  const affix = toRolledAffix(def);

  return renderAffixMechanic(affix, '凡品', {
    abilityTags: def.grantedAbilityTags,
  });
}

describe('affixText mechanic rendering', () => {
  it('renders elemental active damage with damage channel', () => {
    const view = renderAffix('skill-core-damage-fire');

    expect(view.effectText).toContain('火系法术伤害');
    expect(view.bodyText).not.toMatch(/Ability\./);
  });

  it('renders true damage without leaking runtime tags', () => {
    const view = renderAffix('skill-rare-soul-rend');

    expect(view.effectText).toContain('真实伤害');
    expect(view.tagLabels).toContain('真实');
    expect(view.tagLabels.join('、')).not.toMatch(/Ability\./);
  });

  it('expands dot buff details', () => {
    const view = renderAffix('skill-variant-burn-dot');

    expect(view.buffDetails[0]).toMatchObject({
      name: '灼烧',
      typeText: '负面状态',
    });
    expect(view.buffDetails[0].listenerTexts.join('、')).toContain(
      '持续伤害（DOT）',
    );
    expect(view.mechanicNotes.join('、')).toContain('DOT');
    expect(view.bodyText).toContain('60%概率附加「灼烧」');
    expect(view.bodyText).toContain('3回合');
    expect(view.bodyText).toContain('行动前造成');
    expect(view.bodyText).toContain('持续伤害（DOT）');
    expect(view.bodyText).toContain('按层数放大');
  });

  it('deduplicates elemental damage modifier phrasing', () => {
    const view = renderAffix('gongfa-school-fire-spec');

    expect(view.bodyText).toContain('造成火系伤害时');
    expect(view.bodyText).toContain('提升造成的伤害');
    expect(view.bodyText).not.toContain('造成伤害时 造成火系伤害时');
  });

  it('renders elemental damage reduction from target perspective', () => {
    const view = renderAffix('artifact-defense-fire-resist');

    expect(view.bodyText).toContain('受到火系伤害时');
    expect(view.bodyText).toContain('降低受到的伤害');
  });

  it('renders status tag trigger labels in Chinese', () => {
    const view = renderAffix('skill-rare-ignite');

    expect(view.effectText).toContain('灼烧');
    expect(view.effectText).not.toMatch(/Status\./);
  });
});
