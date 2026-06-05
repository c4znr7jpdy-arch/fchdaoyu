import { ELEMENT_VALUES, type ElementType } from '@shared/types/constants';
import { ELEMENT_TO_MATERIAL_TAG } from '../../config/CreationMappings';
import {
  AFFIX_STOP_REASONS,
  AffixCandidate,
  GongfaAffixRole,
} from '../../types';
import { Rule } from '../core';
import { AffixSelectionDecision, AffixSelectionFacts } from '../contracts';

const MIXED_ARCHETYPE = 'mixed-elements';

export class GongfaSchoolPlanRules
  implements Rule<AffixSelectionFacts, AffixSelectionDecision>
{
  readonly id = 'affix.selection.gongfa-school-plan';

  apply({ facts, decision }: Parameters<Rule<AffixSelectionFacts, AffixSelectionDecision>['apply']>[0]): void {
    if (facts.productType !== 'gongfa') {
      return;
    }

    const caps = facts.selectionConstraints.gongfaRoleCaps;
    if (!caps) {
      return;
    }

    let accepted = [...decision.candidatePool];
    accepted = this.applyRoleCaps(accepted, facts, decision);
    accepted = this.applyPrimaryPriority(accepted, facts, decision);
    accepted = this.applyResonanceCompatibility(accepted, facts, decision);

    decision.candidatePool = accepted;
    decision.trace.push({
      ruleId: this.id,
      outcome: 'applied',
      message: `功法流派规划过滤完成：${accepted.length} 个词缀通过`,
      details: {
        selectedGongfaSchoolPlan: facts.selectedGongfaSchoolPlan,
        gongfaRoleCaps: caps,
      },
    });
  }

  private applyRoleCaps(
    candidates: AffixCandidate[],
    facts: AffixSelectionFacts,
    decision: AffixSelectionDecision,
  ): AffixCandidate[] {
    const caps = facts.selectionConstraints.gongfaRoleCaps ?? {};
    const plan = facts.selectedGongfaSchoolPlan;
    const accepted: AffixCandidate[] = [];

    for (const candidate of candidates) {
      const role = candidate.selectionMeta?.gongfa?.role;
      if (!role) {
        accepted.push(candidate);
        continue;
      }

      const current = this.currentRoleCount(role, plan);
      const cap = caps[role] ?? Number.POSITIVE_INFINITY;
      if (current >= cap) {
        this.reject(candidate, decision);
        continue;
      }

      accepted.push(candidate);
    }

    return accepted;
  }

  private applyPrimaryPriority(
    candidates: AffixCandidate[],
    facts: AffixSelectionFacts,
    decision: AffixSelectionDecision,
  ): AffixCandidate[] {
    const plan = facts.selectedGongfaSchoolPlan;

    if (plan?.primarySelected) {
      return candidates.filter((candidate) => {
        if (candidate.selectionMeta?.gongfa?.role !== 'primary') {
          return true;
        }

        this.reject(candidate, decision);
        return false;
      });
    }

    const primaryCandidates = candidates.filter(
      (candidate) => candidate.selectionMeta?.gongfa?.role === 'primary',
    );
    if (primaryCandidates.length === 0) {
      return candidates;
    }

    const inputElements = this.inputElements(facts);
    const mixedPrimary = primaryCandidates.find(
      (candidate) =>
        candidate.selectionMeta?.gongfa?.archetype === MIXED_ARCHETYPE,
    );
    if (mixedPrimary && inputElements.size >= 3) {
      for (const candidate of candidates) {
        if (candidate.id !== mixedPrimary.id) {
          this.reject(candidate, decision);
        }
      }
      return [mixedPrimary];
    }

    const biasedPrimary = facts.elementBias
      ? primaryCandidates.filter(
          (candidate) =>
            candidate.selectionMeta?.gongfa?.element === facts.elementBias,
        )
      : [];
    const preferred = biasedPrimary.length > 0 ? biasedPrimary : primaryCandidates;

    for (const candidate of candidates) {
      if (!preferred.includes(candidate)) {
        this.reject(candidate, decision);
      }
    }

    return preferred;
  }

  private applyResonanceCompatibility(
    candidates: AffixCandidate[],
    facts: AffixSelectionFacts,
    decision: AffixSelectionDecision,
  ): AffixCandidate[] {
    return candidates.filter((candidate) => {
      if (candidate.selectionMeta?.gongfa?.role !== 'resonance') {
        return true;
      }

      if (this.isResonanceCompatible(candidate, facts)) {
        return true;
      }

      this.reject(candidate, decision);
      return false;
    });
  }

  private isResonanceCompatible(
    candidate: AffixCandidate,
    facts: AffixSelectionFacts,
  ): boolean {
    const meta = candidate.selectionMeta?.gongfa;
    const resonanceElements =
      meta?.resonanceElements ?? (meta?.element ? [meta.element] : []);

    if (resonanceElements.length === 0) {
      return true;
    }

    const inputElements = this.inputElements(facts);
    const primaryElement = facts.selectedGongfaSchoolPlan?.primaryElement;

    if (primaryElement) {
      return (
        resonanceElements.includes(primaryElement) &&
        resonanceElements.some(
          (element) => element !== primaryElement && inputElements.has(element),
        )
      );
    }

    if (inputElements.size === 0) {
      return false;
    }

    return resonanceElements.every((element) => inputElements.has(element));
  }

  private currentRoleCount(
    role: GongfaAffixRole,
    plan: AffixSelectionFacts['selectedGongfaSchoolPlan'],
  ): number {
    switch (role) {
      case 'primary':
        return plan?.primarySelected ? 1 : 0;
      case 'resonance':
        return plan?.resonanceCount ?? 0;
      case 'support':
        return plan?.supportCount ?? 0;
      case 'secret':
        return 0;
    }
  }

  private inputElements(facts: AffixSelectionFacts): Set<ElementType> {
    const tags = new Set(facts.inputTags);
    const elements = new Set<ElementType>();

    for (const element of ELEMENT_VALUES) {
      if (tags.has(ELEMENT_TO_MATERIAL_TAG[element])) {
        elements.add(element);
      }
    }

    return elements;
  }

  private reject(
    candidate: AffixCandidate,
    decision: AffixSelectionDecision,
  ): void {
    decision.rejections.push({
      affixId: candidate.id,
      amount: candidate.energyCost,
      reason: AFFIX_STOP_REASONS.CATEGORY_QUOTA_REACHED,
      ...(candidate.exclusiveGroup
        ? { exclusiveGroup: candidate.exclusiveGroup }
        : {}),
    });
    decision.trace.push({
      ruleId: this.id,
      outcome: 'blocked',
      message: '词缀因功法流派规划被过滤',
      details: {
        affixId: candidate.id,
        gongfaSelectionMeta: candidate.selectionMeta?.gongfa,
      },
    });
  }
}
