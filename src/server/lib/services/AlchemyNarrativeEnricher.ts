import { renderPrompt } from '@server/lib/prompts';
import { object } from '@server/utils/aiClient';
import { getConditionStatusTemplate } from '@shared/lib/conditionStatusRegistry';
import { getMaterialAlchemyTagLabel } from '@shared/lib/materialAlchemy';
import { getResourceLabel } from '@shared/lib/resourceText';
import { getTrackConfig } from '@shared/lib/trackConfigRegistry';
import type {
  ConditionTrackPath,
  ConditionStatusKey,
} from '@shared/types/condition';
import type { ElementType, Quality } from '@shared/types/constants';
import type {
  ConditionOperation,
  MaterialAlchemyEffectTag,
  PillFamily,
} from '@shared/types/consumable';
import { z } from 'zod';

function formatPercent(value: number): string {
  const percent = Number((value * 100).toFixed(1));
  return `${Number.isInteger(percent) ? percent.toFixed(0) : percent}%`;
}

function getPillFamilyLabel(family: PillFamily): string {
  switch (family) {
    case 'healing':
      return '疗伤丹';
    case 'mana':
      return '回元丹';
    case 'detox':
      return '解毒丹';
    case 'breakthrough':
      return '破境丹';
    case 'tempering':
      return '炼体丹';
    case 'marrow_wash':
      return '洗髓丹';
    case 'hybrid':
      return '和元丹';
  }
}

function getStatusName(status: ConditionStatusKey): string {
  return getConditionStatusTemplate(status)?.name ?? status;
}

function describeOperation(operation: ConditionOperation): string {
  switch (operation.type) {
    case 'restore_resource':
      return operation.mode === 'percent'
        ? `恢复最大${getResourceLabel(operation.resource)} ${formatPercent(operation.value)}`
        : `恢复${getResourceLabel(operation.resource)} ${operation.value}`;
    case 'change_gauge':
      return `丹毒 ${operation.delta > 0 ? '+' : ''}${operation.delta}`;
    case 'remove_status':
      return `化解「${getStatusName(operation.status)}」`;
    case 'add_status':
      return `获得「${getStatusName(operation.status)}」`;
    case 'advance_track':
      return `推进${getTrackConfig(operation.track).name} +${operation.value}`;
  }
}

function formatTagList(tags: MaterialAlchemyEffectTag[]): string {
  if (tags.length === 0) return '无';
  return tags.map(getMaterialAlchemyTagLabel).join('、');
}

function formatLineList(lines: string[]): string {
  if (lines.length === 0) return '无';
  return lines.map((line) => `- ${line}`).join('\n');
}

function formatMaterialList(materialNames: string[]): string {
  if (materialNames.length === 0) return '无';
  return Array.from(new Set(materialNames)).join('、');
}

const improvisedPillCopySchema = z.object({
  name: z.string().min(2).max(24).describe('符合凡人流仙侠气质的丹药名称'),
  description: z
    .string()
    .min(24)
    .max(120)
    .describe('成丹评述，强调炉意与药性，不重复 UI 的效果说明'),
  styleInsight: z.string().max(80).optional(),
});

const formulaRecordCopySchema = z.object({
  name: z.string().min(2).max(30).describe('符合修仙丹录气质的丹方名称'),
  description: z
    .string()
    .min(24)
    .max(120)
    .describe('丹方描述，说明炉意、药性脉络与适配方向'),
  discoveryRemark: z
    .string()
    .min(16)
    .max(100)
    .describe('玩家悟得丹方时看到的顿悟评语'),
  styleInsight: z.string().max(80).optional(),
});

const formulaBatchDescriptionSchema = z.object({
  description: z
    .string()
    .min(24)
    .max(120)
    .describe('同一丹方本炉次成丹评述，可结合材料与拟合度变化'),
  styleInsight: z.string().max(80).optional(),
});

export type ImprovisedPillCopy = z.infer<typeof improvisedPillCopySchema>;
export type FormulaRecordCopy = z.infer<typeof formulaRecordCopySchema>;
export type FormulaBatchDescriptionCopy = z.infer<
  typeof formulaBatchDescriptionSchema
>;

export interface ImprovisedPillCopyFacts {
  family: PillFamily;
  dominantElement?: ElementType;
  quality: Quality;
  materialNames: string[];
  targetTags: MaterialAlchemyEffectTag[];
  operations: ConditionOperation[];
  stability: number;
  toxicityRating: number;
  userPrompt: string;
  focusMode: 'focused' | 'balanced' | 'risky';
}

export interface FormulaRecordCopyFacts {
  fallbackName: string;
  sourcePillName: string;
  sourcePillDescription: string;
  family: PillFamily;
  dominantElement?: ElementType;
  minQuality?: Quality;
  slotCount: number;
  materialNames: string[];
  requiredTags: MaterialAlchemyEffectTag[];
  optionalTags: MaterialAlchemyEffectTag[];
  operations: ConditionOperation[];
  targetStability: number;
  targetToxicity: number;
  userPrompt?: string;
}

export interface FormulaBatchDescriptionFacts {
  formulaName: string;
  formulaDescription: string;
  family: PillFamily;
  dominantElement?: ElementType;
  quality: Quality;
  materialNames: string[];
  operations: ConditionOperation[];
  fitMultiplier: number;
  stability: number;
  toxicityRating: number;
  masteryLevel: number;
}

const DEFAULT_NARRATIVE_TIMEOUT_MS = 30_000;

export class AlchemyNarrativeEnricher {
  private readonly enabled: boolean;
  private readonly timeoutMs: number;

  constructor(options: { enabled?: boolean; timeoutMs?: number } = {}) {
    this.enabled =
      options.enabled ?? AlchemyNarrativeEnricher.resolveDefaultEnabled();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_NARRATIVE_TIMEOUT_MS;
  }

  private static resolveDefaultEnabled(): boolean {
    if (process.env.DISABLE_LLM_NAMING === 'true') return false;
    if (process.env.ENABLE_LLM_NAMING === 'false') return false;
    return true;
  }

  async generateImprovisedPillCopy(
    facts: ImprovisedPillCopyFacts,
  ): Promise<ImprovisedPillCopy | null> {
    if (!this.enabled) return null;

    try {
      const variables = this.buildImprovisedPillVariables(facts);
      const { system, user } = renderPrompt('alchemy-improvised-copy', variables);
      const response = await this.withTimeout(
        object(
          system,
          user,
          {
            schema: improvisedPillCopySchema,
            schemaName: 'ImprovisedPillCopy',
          },
          true,
        ),
      );
      return response.object;
    } catch (error) {
      console.error('[AlchemyNarrativeEnricher] improvised copy failed:', error);
      return null;
    }
  }

  async generateFormulaRecordCopy(
    facts: FormulaRecordCopyFacts,
  ): Promise<FormulaRecordCopy | null> {
    if (!this.enabled) return null;

    try {
      const variables = this.buildFormulaRecordVariables(facts);
      const { system, user } = renderPrompt('alchemy-formula-copy', variables);
      const response = await this.withTimeout(
        object(
          system,
          user,
          {
            schema: formulaRecordCopySchema,
            schemaName: 'AlchemyFormulaRecordCopy',
          },
          true,
        ),
      );
      return response.object;
    } catch (error) {
      console.error('[AlchemyNarrativeEnricher] formula copy failed:', error);
      return null;
    }
  }

  async generateFormulaBatchDescription(
    facts: FormulaBatchDescriptionFacts,
  ): Promise<FormulaBatchDescriptionCopy | null> {
    if (!this.enabled) return null;

    try {
      const variables = this.buildFormulaBatchVariables(facts);
      const { system, user } = renderPrompt(
        'alchemy-formula-batch-copy',
        variables,
      );
      const response = await this.withTimeout(
        object(
          system,
          user,
          {
            schema: formulaBatchDescriptionSchema,
            schemaName: 'AlchemyFormulaBatchDescription',
          },
          true,
        ),
      );
      return response.object;
    } catch (error) {
      console.error(
        '[AlchemyNarrativeEnricher] formula batch description failed:',
        error,
      );
      return null;
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(
          () => reject(new Error('LLM alchemy narrative timeout')),
          this.timeoutMs,
        );
      }),
    ]);
  }

  private buildImprovisedPillVariables(facts: ImprovisedPillCopyFacts) {
    return {
      familyText: getPillFamilyLabel(facts.family),
      qualityText: facts.quality,
      elementText: facts.dominantElement ?? '未显主元素',
      materialsText: formatMaterialList(facts.materialNames),
      targetTagsText: formatTagList(facts.targetTags),
      operationLinesText: formatLineList(facts.operations.map(describeOperation)),
      stabilityText: String(facts.stability),
      toxicityText: String(facts.toxicityRating),
      userPromptText: facts.userPrompt.trim(),
      focusModeText: this.getFocusModeText(facts.focusMode),
    };
  }

  private buildFormulaRecordVariables(facts: FormulaRecordCopyFacts) {
    return {
      fallbackNameText: facts.fallbackName,
      sourcePillNameText: facts.sourcePillName,
      sourcePillDescriptionText: facts.sourcePillDescription,
      familyText: getPillFamilyLabel(facts.family),
      elementText: facts.dominantElement ?? '未显主元素',
      minQualityText: facts.minQuality ?? '未限定',
      slotCountText: String(facts.slotCount),
      materialsText: formatMaterialList(facts.materialNames),
      requiredTagsText: formatTagList(facts.requiredTags),
      optionalTagsText: formatTagList(facts.optionalTags),
      operationLinesText: formatLineList(facts.operations.map(describeOperation)),
      targetStabilityText: String(facts.targetStability),
      targetToxicityText: String(facts.targetToxicity),
      userPromptText: facts.userPrompt?.trim() || '无',
    };
  }

  private buildFormulaBatchVariables(facts: FormulaBatchDescriptionFacts) {
    return {
      formulaNameText: facts.formulaName,
      formulaDescriptionText: facts.formulaDescription,
      familyText: getPillFamilyLabel(facts.family),
      qualityText: facts.quality,
      elementText: facts.dominantElement ?? '未显主元素',
      materialsText: formatMaterialList(facts.materialNames),
      operationLinesText: formatLineList(facts.operations.map(describeOperation)),
      fitPercentText: `${Math.round(facts.fitMultiplier * 100)}%`,
      stabilityText: String(facts.stability),
      toxicityText: String(facts.toxicityRating),
      masteryLevelText: String(facts.masteryLevel),
    };
  }

  private getFocusModeText(
    focusMode: ImprovisedPillCopyFacts['focusMode'],
  ): string {
    switch (focusMode) {
      case 'focused':
        return '专精凝意';
      case 'balanced':
        return '调和并济';
      case 'risky':
        return '险进催化';
    }
  }
}

export function getAlchemyNarrativeOperationLines(
  operations: ConditionOperation[],
): string[] {
  return operations.map(describeOperation);
}

export function getAlchemyNarrativeTrackName(
  track: ConditionTrackPath,
): string {
  return getTrackConfig(track).name;
}
