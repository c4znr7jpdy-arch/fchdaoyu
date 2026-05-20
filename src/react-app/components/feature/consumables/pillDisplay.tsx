import { getPillUsageKeywordLabel, getPillUsageRuleText } from '@shared/lib/pillUsageText';
import { InkBadge } from '@app/components/ui/InkBadge';
import {
  getAffixToneStyle,
  getAffixUnderlineStyle,
} from '@app/components/feature/products/affixPresentation';
import { getConditionStatusTemplate } from '@shared/lib/conditionStatusRegistry';
import { getResourceLabel } from '@shared/lib/resourceText';
import { getTrackConfig } from '@shared/lib/trackConfigRegistry';
import type { RealmType } from '@shared/types/constants';
import type { Consumable } from '@shared/types/cultivator';
import type {
  ConditionOperation,
  PillFamily,
  PillSpec,
} from '@shared/types/consumable';
import type { ConditionStatusKey } from '@shared/types/condition';

export interface PillDetailGroup {
  key: string;
  title: string;
  lines: string[];
}

export interface PillDisplayModel {
  familyLabel: string;
  primaryEffect: string;
  keywordLabels: string[];
  detailGroups: PillDetailGroup[];
  flavorText?: string;
}

function formatPercent(value: number): string {
  const percent = Number((value * 100).toFixed(1));
  return `${Number.isInteger(percent) ? percent.toFixed(0) : percent}%`;
}

function getStatusName(status: ConditionStatusKey): string {
  return getConditionStatusTemplate(status)?.name ?? status;
}

function getRestoreEffectText(
  operation: Extract<ConditionOperation, { type: 'restore_resource' }>,
): string {
  if (operation.mode === 'percent') {
    return `恢复最大${getResourceLabel(operation.resource)} ${formatPercent(operation.value)}`;
  }

  return `恢复${getResourceLabel(operation.resource)} ${operation.value}`;
}

function getRestoreTargetText(
  operation: Extract<ConditionOperation, { type: 'restore_resource' }>,
): string {
  if (operation.mode === 'percent') {
    return `最大${getResourceLabel(operation.resource)} ${formatPercent(operation.value)}`;
  }

  return `${getResourceLabel(operation.resource)} ${operation.value}`;
}

function getGaugeChangeText(delta: number): string {
  return `丹毒 ${delta > 0 ? '+' : ''}${delta}`;
}

export function getPillFamilyLabel(family: PillFamily): string {
  switch (family) {
    case 'healing':
      return '疗伤';
    case 'mana':
      return '回元';
    case 'detox':
      return '解毒';
    case 'breakthrough':
      return '破境';
    case 'tempering':
      return '炼体';
    case 'marrow_wash':
      return '洗髓';
    case 'hybrid':
      return '复合';
  }
}

export function describePillOperation(operation: ConditionOperation): string {
  switch (operation.type) {
    case 'restore_resource':
      return getRestoreEffectText(operation);
    case 'change_gauge':
      return getGaugeChangeText(operation.delta);
    case 'remove_status':
      return `化解「${getStatusName(operation.status)}」`;
    case 'add_status':
      return `获得「${getStatusName(operation.status)}」${
        typeof operation.usesRemaining === 'number'
          ? `（可用 ${operation.usesRemaining} 次）`
          : ''
      }`;
    case 'advance_track':
      return `推进${getTrackConfig(operation.track).name} +${operation.value}`;
  }
}

function buildPrimaryEffect(spec: PillSpec): string {
  switch (spec.family) {
    case 'healing':
    case 'mana': {
      const restore = spec.operations.find(
        (
          operation,
        ): operation is Extract<ConditionOperation, { type: 'restore_resource' }> =>
          operation.type === 'restore_resource',
      );
      return restore
        ? getRestoreEffectText(restore)
        : `${getPillFamilyLabel(spec.family)}药效`;
    }
    case 'hybrid': {
      const restores = spec.operations.filter(
        (
          operation,
        ): operation is Extract<ConditionOperation, { type: 'restore_resource' }> =>
          operation.type === 'restore_resource',
      );
      if (restores.length === 0) return '复合药效';

      return restores
        .map((operation, index) =>
          index === 0
            ? getRestoreEffectText(operation)
            : getRestoreTargetText(operation),
        )
        .join(' / ');
    }
    case 'detox': {
      const detox = spec.operations.find(
        (
          operation,
        ): operation is Extract<ConditionOperation, { type: 'change_gauge' }> =>
          operation.type === 'change_gauge',
      );
      return detox ? getGaugeChangeText(detox.delta) : '调理丹毒';
    }
    case 'breakthrough': {
      const status = spec.operations.find(
        (
          operation,
        ): operation is Extract<ConditionOperation, { type: 'add_status' }> =>
          operation.type === 'add_status',
      );
      return status ? describePillOperation(status) : '助力破境';
    }
    case 'tempering':
    case 'marrow_wash': {
      const advance = spec.operations.find(
        (
          operation,
        ): operation is Extract<ConditionOperation, { type: 'advance_track' }> =>
          operation.type === 'advance_track',
      );
      return advance ? describePillOperation(advance) : '推进修炼进度';
    }
  }
}

function buildKeywordLabels(spec: PillSpec, realm?: RealmType): string[] {
  const labels = [
    getPillFamilyLabel(spec.family),
    getPillUsageKeywordLabel(spec.consumeRules.countsTowardLongTermQuota, realm),
  ].filter((label): label is string => Boolean(label));

  const gaugeChange = spec.operations.find(
    (
      operation,
    ): operation is Extract<ConditionOperation, { type: 'change_gauge' }> =>
      operation.type === 'change_gauge',
  );
  if (gaugeChange) {
    labels.push(getGaugeChangeText(gaugeChange.delta));
  }

  return labels.slice(0, 3);
}

function buildCoreEffectLines(spec: PillSpec): string[] {
  return spec.operations
    .filter(
      (operation) =>
        operation.type !== 'change_gauge' || operation.delta < 0,
    )
    .map(describePillOperation);
}

function buildCostAndRuleLines(spec: PillSpec, realm?: RealmType): string[] {
  const lines = spec.operations
    .filter(
      (
        operation,
      ): operation is Extract<ConditionOperation, { type: 'change_gauge' }> =>
        operation.type === 'change_gauge' && operation.delta >= 0,
    )
    .map((operation) => describePillOperation(operation));

  lines.push('仅可在场外服用');
  const usageRuleText = getPillUsageRuleText(
    spec.consumeRules.countsTowardLongTermQuota,
    realm,
  );
  if (usageRuleText) {
    lines.push(usageRuleText);
  }

  return lines;
}

function buildAlchemyInfoLines(consumable: Consumable & { spec: PillSpec }): string[] {
  const { alchemyMeta } = consumable.spec;

  return [
    `丹药类别：${getPillFamilyLabel(consumable.spec.family)}`,
    `炼制来源：${alchemyMeta.source === 'formula' ? '丹方炼制' : '即兴炼制'}`,
    `稳度：${alchemyMeta.stability}`,
    `丹毒评定：${alchemyMeta.toxicityRating}`,
    alchemyMeta.dominantElement
      ? `主元素：${alchemyMeta.dominantElement}`
      : undefined,
    alchemyMeta.sourceMaterials.length > 0
      ? `炼制材料：${alchemyMeta.sourceMaterials.join('、')}`
      : undefined,
  ].filter((line): line is string => Boolean(line));
}

export function toPillDisplayModel(
  consumable: Consumable & { spec: PillSpec },
  options?: { realm?: RealmType },
): PillDisplayModel {
  return {
    familyLabel: getPillFamilyLabel(consumable.spec.family),
    primaryEffect: buildPrimaryEffect(consumable.spec),
    keywordLabels: buildKeywordLabels(consumable.spec, options?.realm),
    detailGroups: [
      {
        key: 'core-effects',
        title: '核心药效',
        lines: buildCoreEffectLines(consumable.spec),
      },
      {
        key: 'cost-and-rules',
        title: '代价与规则',
        lines: buildCostAndRuleLines(consumable.spec, options?.realm),
      },
      {
        key: 'alchemy-info',
        title: '炼制信息',
        lines: buildAlchemyInfoLines(consumable),
      },
    ],
    flavorText: consumable.description,
  };
}

export function PillKeywordLine({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;

  return (
    <div className="text-ink-secondary flex flex-wrap gap-x-2 gap-y-1 text-xs">
      {labels.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className="relative inline-flex border-b border-dashed pb-px"
          data-pill-keyword={label}
          style={
            label.includes('丹毒')
              ? {
                  ...getAffixUnderlineStyle(false),
                  color: 'rgba(193, 18, 31, 0.76)',
                }
              : {
                  ...getAffixUnderlineStyle(false),
                  ...getAffixToneStyle(
                    label.startsWith('服用上限') ? 'info' : 'muted',
                  ),
                }
          }
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function PillSummary({ model }: { model: PillDisplayModel }) {
  return (
    <div className="space-y-2 border border-dashed border-ink/10 px-3 py-2 text-left">
      <div className="text-ink text-sm font-semibold leading-relaxed">
        {model.primaryEffect}
      </div>
      <PillKeywordLine labels={model.keywordLabels} />
    </div>
  );
}

export function PillDetailGroups({ groups }: { groups: PillDetailGroup[] }) {
  return (
    <div className="space-y-3">
      {groups
        .filter((group) => group.lines.length > 0)
        .map((group) => (
          <section key={group.key} className="space-y-1.5">
            <h3 className="text-ink-secondary text-xs font-semibold tracking-wide">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.lines.map((line, index) => (
                <li
                  key={`${group.key}-${line}-${index}`}
                  className="border border-dashed border-ink/10 px-2 py-1.5 text-sm leading-relaxed text-ink-secondary"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

export function PillKeywordBadges({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label, index) => (
        <InkBadge key={`${label}-${index}`} tone="default">
          {label}
        </InkBadge>
      ))}
    </div>
  );
}
