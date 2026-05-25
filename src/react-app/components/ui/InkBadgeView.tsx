import { cn } from '@shared/lib/cn';
import { tierColorMap, type Tier } from './inkBadgeTiers';

/**
 * 色调类型映射
 */
const toneColorMap = {
  default: 'text-ink-secondary',
  accent: 'text-crimson',
  warning: 'text-wood',
  danger: 'text-crimson',
};

export interface InkBadgeProps {
  children?: string;
  tier?: Tier;
  tierText?: string;
  tone?: 'default' | 'accent' | 'warning' | 'danger';
  compact?: boolean;
  className?: string;
  hideTierText?: boolean;
}

/**
 * 品阶徽记组件
 * 根据品阶显示对应颜色的「品阶」标记
 */
export function InkBadge({
  children,
  tier,
  tierText,
  tone = 'default',
  compact = false,
  className = '',
  hideTierText = false,
}: InkBadgeProps) {
  // 优先使用品阶颜色，否则使用色调颜色
  const colorClass = tier ? tierColorMap[tier] : toneColorMap[tone];

  const combinedClass = cn(
    'inline-flex items-center px-1',
    compact ? 'text-xs' : 'text-sm',
    colorClass,
    className,
  );

  const wrapBadgeText = (text: string) =>
    text.startsWith('「') && text.endsWith('」') ? text : `「${text}」`;

  // 构建显示内容
  const displayContent = hideTierText
    ? children
    : tier
      ? `「${tierText || tier}」${children || ''}`
      : children
        ? wrapBadgeText(children)
        : '';

  return <span className={combinedClass}>{displayContent}</span>;
}
