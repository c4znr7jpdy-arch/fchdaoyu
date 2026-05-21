import { describe, expect, it } from 'vitest';
import { CreationTags } from '@shared/engine/shared/tag-domain';
import { CreationOrchestrator } from './CreationOrchestrator';

function buildIntentInput(seed: string, sessionId?: string) {
  return {
    ...(sessionId ? { sessionId } : {}),
    productType: 'skill' as const,
    energyBudget: 72,
    unlockScore: 95,
    dominantTags: [
      CreationTags.MATERIAL.SEMANTIC_FLAME,
      CreationTags.MATERIAL.SEMANTIC_BURST,
    ],
    elementBias: '火' as const,
    requestedTargetPolicy: { team: 'enemy' as const, scope: 'single' as const },
    seed,
    slugSeed: 'intent-skill-fire-offense-0',
    stableOutputKey: 'enemy:intent-test:skill:0',
    maxAffixCount: 3,
  };
}

function buildSkillSignature(
  session: ReturnType<CreationOrchestrator['craftFromIntent']>,
): string {
  const model = session.state.blueprint?.productModel;
  if (!model || model.productType !== 'skill') {
    throw new Error('Expected skill product model');
  }

  return JSON.stringify({
    slug: model.slug,
    affixes: session.state.rolledAffixes.map((affix) => [
      affix.id,
      Number(affix.finalMultiplier.toFixed(6)),
    ]),
    mpCost: model.battleProjection.mpCost,
    cooldown: model.battleProjection.cooldown,
    tags: model.battleProjection.abilityTags,
  });
}

describe('CreationOrchestrator.craftFromIntent', () => {
  it('is deterministic for the same seed and does not retain sessions', () => {
    const orchestrator = new CreationOrchestrator();

    const left = orchestrator.craftFromIntent(buildIntentInput('same-seed', 'intent-a'));
    const right = orchestrator.craftFromIntent(buildIntentInput('same-seed', 'intent-b'));

    expect(buildSkillSignature(left)).toBe(buildSkillSignature(right));
    expect(orchestrator.getSession(left.id)).toBeUndefined();
    expect(orchestrator.getSession(right.id)).toBeUndefined();
  });

  it('keeps slug stable even when session ids differ', () => {
    const orchestrator = new CreationOrchestrator();

    const left = orchestrator.craftFromIntent(buildIntentInput('slug-seed', 'intent-left'));
    const right = orchestrator.craftFromIntent(buildIntentInput('slug-seed', 'intent-right'));

    expect(left.state.blueprint?.productModel.slug).toBe(
      right.state.blueprint?.productModel.slug,
    );
  });

  it('produces visible variation across different seeds', () => {
    const orchestrator = new CreationOrchestrator();
    const signatures = ['seed-a', 'seed-b', 'seed-c', 'seed-d'].map((seed) =>
      buildSkillSignature(orchestrator.craftFromIntent(buildIntentInput(seed))),
    );

    expect(new Set(signatures).size).toBeGreaterThan(1);
  });

  it('gates high-tier affixes by unlock score while keeping the same intent route', () => {
    const orchestrator = new CreationOrchestrator();
    const low = orchestrator.craftFromIntent({
      ...buildIntentInput('low-tier'),
      energyBudget: 24,
      unlockScore: 20,
      maxAffixCount: 1,
    });
    const high = orchestrator.craftFromIntent({
      ...buildIntentInput('high-tier'),
      energyBudget: 90,
      unlockScore: 95,
      dominantTags: [
        CreationTags.MATERIAL.SEMANTIC_FLAME,
        CreationTags.MATERIAL.SEMANTIC_BURST,
        CreationTags.MATERIAL.TYPE_SPECIAL,
      ],
    });

    expect(
      low.state.affixPool.some((candidate) => candidate.category === 'skill_rare'),
    ).toBe(false);
    expect(
      high.state.affixPool.some((candidate) => candidate.category === 'skill_rare'),
    ).toBe(true);
  });
});
