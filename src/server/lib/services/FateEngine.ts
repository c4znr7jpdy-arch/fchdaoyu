import { createHash } from 'node:crypto';

import {
  normalizeFate as normalizeSharedFate,
  normalizeFates as normalizeSharedFates,
} from '@shared/lib/fates';
import type {
  Cultivator,
  FateGenerationCategory,
  PreHeavenFate,
} from '@shared/types/cultivator';
import type { Quality } from '@shared/types/constants';
import { QUALITY_ORDER } from '@shared/types/constants';
import {
  FATE_CANDIDATE_COUNT,
  FATE_CANDIDATE_QUALITY_SLOTS,
  FATE_DUAL_SIDED_CHANCE,
  FATE_QUALITY_ORDER,
  FATE_SLOT_COUNT,
} from './FateConfig';
import {
  buildFallbackFateDescription,
  buildFallbackFateName,
  buildFateEffectEntry,
  getFateRollVersion,
  getNegativeFateEffects,
  getPositiveFateEffects,
  isHighQualityFate,
  type FateEffectDefinition,
} from './FateFragmentRegistry';
import {
  FateNamingEnricher,
  type FateNamingFacts,
} from './FateNamingEnricher';

interface FateGenerationOptions {
  rng?: () => number;
}

const DEFAULT_NAMER = new FateNamingEnricher();

function buildPromptText(cultivator: Cultivator): string {
  return [
    cultivator.prompt,
    cultivator.background,
    cultivator.origin,
    cultivator.personality,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function keywordHitCount(prompt: string, keywords: string[]): number {
  return keywords.reduce(
    (sum, keyword) => sum + (prompt.includes(keyword.toLowerCase()) ? 1 : 0),
    0,
  );
}

function weightedPickOne<T>(
  pool: Array<{ value: T; weight: number }>,
  rng: () => number,
): T | null {
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce(
    (sum, entry) => sum + Math.max(entry.weight, 0.01),
    0,
  );
  let roll = rng() * totalWeight;
  for (const entry of pool) {
    roll -= Math.max(entry.weight, 0.01);
    if (roll <= 0) {
      return entry.value;
    }
  }
  return pool[pool.length - 1]?.value ?? null;
}

function createCompositionHash(
  quality: Quality,
  effectIds: string[],
  category: FateGenerationCategory,
): string {
  return createHash('sha1')
    .update(
      JSON.stringify({
        quality,
        category,
        effectIds: [...effectIds].sort(),
      }),
    )
    .digest('hex')
    .slice(0, 12);
}

function scoreEffect(
  definition: FateEffectDefinition,
  cultivator: Cultivator,
): number {
  const prompt = buildPromptText(cultivator);
  return definition.weight + keywordHitCount(prompt, definition.keywords) * 0.3;
}

function pickTargetQuality(
  qualities: Quality[],
  rng: () => number,
): Quality | null {
  return weightedPickOne(
    qualities.map((quality) => ({
      value: quality,
      weight: QUALITY_ORDER[quality] + 1,
    })),
    rng,
  );
}

function qualityFallbackChain(
  target: Quality,
  slotQualities: Quality[],
): Quality[] {
  return FATE_QUALITY_ORDER.filter(
    (quality) =>
      QUALITY_ORDER[quality] <= QUALITY_ORDER[target] &&
      slotQualities.includes(quality),
  ).sort((left, right) => QUALITY_ORDER[right] - QUALITY_ORDER[left]);
}

function shouldGenerateDualSided(
  quality: Quality,
  dualSidedUsed: boolean,
  rng: () => number,
): boolean {
  if (dualSidedUsed || !isHighQualityFate(quality)) {
    return false;
  }

  return rng() < (FATE_DUAL_SIDED_CHANCE[quality] ?? 0);
}

function composeCandidate(
  cultivator: Cultivator,
  quality: Quality,
  rng: () => number,
  dualSidedUsed: boolean,
  usedHashes: Set<string>,
): PreHeavenFate | null {
  const positivePool = getPositiveFateEffects().map((effect) => ({
    value: effect,
    weight: scoreEffect(effect, cultivator),
  }));

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const positive = weightedPickOne(positivePool, rng);
    if (!positive) {
      return null;
    }

    const wantsDualSided = shouldGenerateDualSided(quality, dualSidedUsed, rng);
    const negativePool = wantsDualSided
      ? getNegativeFateEffects()
          .filter((effect) => effect.family !== positive.family)
          .map((effect) => ({
            value: effect,
            weight: scoreEffect(effect, cultivator),
          }))
      : [];
    const negative = wantsDualSided ? weightedPickOne(negativePool, rng) : null;
    const category: FateGenerationCategory =
      wantsDualSided && negative ? 'dual_sided' : 'single_positive';
    const effectIds = negative
      ? [positive.id, negative.id]
      : [positive.id];
    const compositionHash = createCompositionHash(quality, effectIds, category);
    if (usedHashes.has(compositionHash)) {
      continue;
    }

    const effects = [
      buildFateEffectEntry(positive, quality, rng),
      ...(negative ? [buildFateEffectEntry(negative, quality, rng)] : []),
    ];
    const fallbackName = buildFallbackFateName(positive, quality);
    const fallbackDescription = buildFallbackFateDescription(effects);

    usedHashes.add(compositionHash);

    return {
      name: fallbackName,
      quality,
      description: fallbackDescription,
      effects,
      generationModel: {
        version: 'v5',
        rollVersion: getFateRollVersion(),
        quality,
        effectIds,
        compositionHash,
        category,
      },
      namingMetadata: {
        status: 'fallback',
        originalName: fallbackName,
      },
    };
  }

  return null;
}

async function enrichFateNames(
  fates: PreHeavenFate[],
): Promise<PreHeavenFate[]> {
  const normalized = normalizeSharedFates(fates);
  const facts: FateNamingFacts[] = normalized.map((fate) => {
    const [primary, burden] = fate.effects ?? [];
    return {
      quality: fate.quality ?? '凡品',
      primaryEffectLabel: primary?.label ?? '命格未明',
      burdenEffectLabel: burden?.label,
      isDualSided: (fate.effects?.length ?? 0) > 1,
      fallbackDescription: fate.description ?? '',
    };
  });

  const enrichments = await DEFAULT_NAMER.enrichBatch(facts);
  if (!enrichments) {
    return normalized;
  }

  return normalized.map((fate, index) => {
    const enrichment = enrichments[index];
    if (!enrichment) return fate;
    return {
      ...fate,
      name: enrichment.name,
      description: enrichment.description,
      namingMetadata: {
        status: 'success',
        originalName: fate.name,
        provider: 'deepseek',
        styleInsight: enrichment.styleInsight,
      },
    };
  });
}

export const FateEngine = {
  normalizeFate(fate: PreHeavenFate): PreHeavenFate {
    return normalizeSharedFate(fate);
  },

  normalizeFates(fates: PreHeavenFate[]): PreHeavenFate[] {
    return normalizeSharedFates(fates);
  },

  async generateCandidatePool(
    cultivator: Cultivator,
    options: FateGenerationOptions | (() => number) = {},
  ): Promise<PreHeavenFate[]> {
    const rng = typeof options === 'function' ? options : options.rng ?? Math.random;
    const usedHashes = new Set<string>();
    const generated: PreHeavenFate[] = [];
    let dualSidedUsed = false;

    for (const slotQualities of FATE_CANDIDATE_QUALITY_SLOTS) {
      const targetQuality = pickTargetQuality(slotQualities, rng);
      const fallbackQualities = targetQuality
        ? qualityFallbackChain(targetQuality, slotQualities)
        : [...slotQualities].sort(
            (left, right) => QUALITY_ORDER[right] - QUALITY_ORDER[left],
          );

      let candidate: PreHeavenFate | null = null;
      for (const quality of fallbackQualities) {
        candidate = composeCandidate(
          cultivator,
          quality,
          rng,
          dualSidedUsed,
          usedHashes,
        );
        if (candidate) {
          dualSidedUsed =
            dualSidedUsed ||
            candidate.generationModel?.category === 'dual_sided';
          break;
        }
      }

      if (candidate) {
        generated.push(candidate);
      }
    }

    if (generated.length < FATE_CANDIDATE_COUNT) {
      for (const quality of [...FATE_QUALITY_ORDER].reverse()) {
        if (generated.length >= FATE_CANDIDATE_COUNT) break;
        const candidate = composeCandidate(
          cultivator,
          quality,
          rng,
          dualSidedUsed,
          usedHashes,
        );
        if (candidate) {
          dualSidedUsed =
            dualSidedUsed ||
            candidate.generationModel?.category === 'dual_sided';
          generated.push(candidate);
        }
      }
    }

    return enrichFateNames(generated);
  },

  async rerollWholeSet(
    cultivator: Cultivator,
    options: FateGenerationOptions | (() => number) = {},
  ): Promise<PreHeavenFate[]> {
    return this.generateCandidatePool(cultivator, options);
  },

  getSelectedFates(fates: PreHeavenFate[]): PreHeavenFate[] {
    return this.normalizeFates(fates).slice(0, FATE_SLOT_COUNT);
  },
};
