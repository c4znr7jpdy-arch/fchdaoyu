import { GameplayTags } from '@shared/engine/shared/tag-domain';
import type { AbilitySelectionIntent } from '../core/configs';
import { BuffType } from '../core/types';
import { Unit } from '../units/Unit';
import { ActiveSkill } from './ActiveSkill';

export interface AbilitySelectionCandidate {
  ability: ActiveSkill;
  target: Unit;
  order: number;
}

export interface AbilitySelectionContext {
  caster: Unit;
  opponent: Unit | null;
  candidates: AbilitySelectionCandidate[];
}

export interface AbilitySelectionResult {
  ability: ActiveSkill;
  target: Unit;
  score: number;
}

export interface AbilitySelectionStrategy {
  select(context: AbilitySelectionContext): AbilitySelectionResult | null;
}

export class DefaultAbilitySelectionStrategy implements AbilitySelectionStrategy {
  select(context: AbilitySelectionContext): AbilitySelectionResult | null {
    const scored = context.candidates
      .map((candidate) => this.scoreCandidate(candidate, context))
      .filter(
        (result): result is AbilitySelectionResult & { order: number } =>
          result !== null,
      );

    if (scored.length === 0) {
      return null;
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.ability.priority !== a.ability.priority) {
        return b.ability.priority - a.ability.priority;
      }
      return a.order - b.order || a.ability.id.localeCompare(b.ability.id);
    });

    const { order: _order, ...best } = scored[0];
    return best;
  }

  private scoreCandidate(
    candidate: AbilitySelectionCandidate,
    context: AbilitySelectionContext,
  ): (AbilitySelectionResult & { order: number }) | null {
    const intents = this.resolveIntents(candidate.ability);
    const caster = context.caster;
    const target = candidate.target;
    let score = candidate.ability.priority;

    if (intents.includes('heal_hp')) {
      const hpPercent = caster.getHpPercent();
      if (hpPercent >= 0.85) return null;
      score += hpPercent <= 0.35 ? 140 : 90 * (1 - hpPercent);
    }

    if (intents.includes('restore_mp')) {
      const mpPercent = caster.getMpPercent();
      if (mpPercent >= 0.75) return null;
      score += 70 * (1 - mpPercent);
    }

    if (intents.includes('control')) {
      if (
        this.targetHasControl(target) ||
        target.tags.hasTag(GameplayTags.STATUS.IMMUNE.CONTROL)
      ) {
        return null;
      }
      score += target.getHpPercent() <= 0.2 ? -25 : 35;
    }

    if (intents.includes('damage')) {
      score += 25 + (1 - target.getHpPercent()) * 45;
    }

    if (intents.includes('buff')) {
      score += 10;
    }

    if (intents.includes('defensive')) {
      if (caster.getCurrentShield() > 0) score -= 35;
      score += caster.getHpPercent() <= 0.5 ? 35 : 5;
    }

    return {
      ability: candidate.ability,
      target,
      score,
      order: candidate.order,
    };
  }

  private resolveIntents(ability: ActiveSkill): AbilitySelectionIntent[] {
    const explicit = ability.selectionProfile?.intents;
    if (explicit?.length) {
      return explicit;
    }

    const intents: AbilitySelectionIntent[] = [];
    if (ability.tags.hasTag(GameplayTags.ABILITY.FUNCTION.HEAL)) {
      intents.push('heal_hp');
    }
    if (ability.tags.hasTag(GameplayTags.ABILITY.FUNCTION.CONTROL)) {
      intents.push('control');
    }
    if (ability.tags.hasTag(GameplayTags.ABILITY.FUNCTION.DAMAGE)) {
      intents.push('damage');
    }
    if (ability.tags.hasTag(GameplayTags.ABILITY.FUNCTION.BUFF)) {
      intents.push('buff');
    }

    if (intents.length === 0 && ability.targetPolicy.team === 'self') {
      intents.push('buff');
    }
    if (intents.length === 0) {
      intents.push('damage');
    }

    return intents;
  }

  private targetHasControl(target: Unit): boolean {
    if (target.tags.hasTag(GameplayTags.STATUS.CONTROL.ROOT)) {
      return true;
    }

    return target.buffs
      .getAllBuffs()
      .some(
        (buff) =>
          buff.type === BuffType.CONTROL ||
          buff.tags.hasTag(GameplayTags.BUFF.TYPE.CONTROL),
      );
  }
}
