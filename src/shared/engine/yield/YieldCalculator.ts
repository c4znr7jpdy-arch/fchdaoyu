import { calculateCultivationExp } from '@server/utils/cultivationUtils';
import type { ResourceOperation } from '@shared/engine/resource/types';
import {
  REALM_YIELD_RATES,
  type Quality,
  type RealmType,
} from '@shared/types/constants';
import type { Cultivator } from '@shared/types/cultivator';

export const YIELD_MATERIAL_QUALITY_CHANCE_BY_REALM: Record<
  RealmType,
  Record<Quality, number>
> = {
  炼气: {
    凡品: 0.45,
    灵品: 0.3,
    玄品: 0.18,
    真品: 0.06,
    地品: 0.01,
    天品: 0,
    仙品: 0,
    神品: 0,
  },
  筑基: {
    凡品: 0.35,
    灵品: 0.3,
    玄品: 0.2,
    真品: 0.1,
    地品: 0.05,
    天品: 0,
    仙品: 0,
    神品: 0,
  },
  金丹: {
    凡品: 0.25,
    灵品: 0.28,
    玄品: 0.22,
    真品: 0.14,
    地品: 0.09,
    天品: 0.02,
    仙品: 0,
    神品: 0,
  },
  元婴: {
    凡品: 0.18,
    灵品: 0.24,
    玄品: 0.23,
    真品: 0.16,
    地品: 0.12,
    天品: 0.06,
    仙品: 0.01,
    神品: 0,
  },
  化神: {
    凡品: 0.12,
    灵品: 0.2,
    玄品: 0.23,
    真品: 0.18,
    地品: 0.14,
    天品: 0.09,
    仙品: 0.03,
    神品: 0.01,
  },
  炼虚: {
    凡品: 0.08,
    灵品: 0.16,
    玄品: 0.22,
    真品: 0.18,
    地品: 0.16,
    天品: 0.12,
    仙品: 0.06,
    神品: 0.02,
  },
  合体: {
    凡品: 0.05,
    灵品: 0.12,
    玄品: 0.2,
    真品: 0.18,
    地品: 0.18,
    天品: 0.15,
    仙品: 0.09,
    神品: 0.03,
  },
  大乘: {
    凡品: 0.03,
    灵品: 0.09,
    玄品: 0.16,
    真品: 0.18,
    地品: 0.2,
    天品: 0.18,
    仙品: 0.12,
    神品: 0.04,
  },
  渡劫: {
    凡品: 0.02,
    灵品: 0.06,
    玄品: 0.12,
    真品: 0.16,
    地品: 0.2,
    天品: 0.22,
    仙品: 0.16,
    神品: 0.06,
  },
};

/**
 * 历练收益计算器
 *
 * 根据角色境界和历练时长计算奖励
 */
export class YieldCalculator {
  static getMaterialQualityChanceMap(realm: RealmType): Record<Quality, number> {
    return YIELD_MATERIAL_QUALITY_CHANCE_BY_REALM[realm];
  }

  /**
   * 计算历练奖励列表
   * @param realm 角色境界
   * @param hoursElapsed 历练小时数
   * @param cultivator 完整角色信息（可选，用于精确计算修为）
   * @returns ResourceOperation[] 奖励列表
   */
  static calculateYield(
    realm: RealmType,
    hoursElapsed: number,
    cultivator?: Cultivator,
  ): ResourceOperation[] {
    const operations: ResourceOperation[] = [];

    // 1. 灵石奖励（保留原有逻辑）
    const baseRate = REALM_YIELD_RATES[realm] || 10;
    const randomMultiplier = 0.8 + Math.random() * 1.2;
    const spiritStones = Math.floor(baseRate * hoursElapsed * randomMultiplier);
    operations.push({
      type: 'spirit_stones',
      value: spiritStones,
    });

    // 2. 修为奖励（重构：复用闭关系统）
    if (cultivator) {
      // 复用 calculateCultivationExp，2小时=闭关1年
      const expResult = calculateCultivationExp(cultivator, hoursElapsed / 2);
      if (expResult.exp_gained > 0) {
        operations.push({
          type: 'cultivation_exp',
          value: expResult.exp_gained,
        });
      }

      // 感悟值：1小时随机1-2点
      const insightGain = Math.floor(
        Math.floor(1 + Math.random() * 2) * hoursElapsed,
      );
      if (insightGain > 0) {
        operations.push({
          type: 'comprehension_insight',
          value: insightGain,
        });
      }

      // 顿悟额外感悟值（闭关系统可能触发顿悟）
      if (expResult.insight_gained > 0) {
        operations.push({
          type: 'comprehension_insight',
          value: expResult.insight_gained,
        });
      }
    } else {
      // 降级处理（兼容性，如果未传cultivator）
      const expGain = Math.floor(baseRate * 0.1 * hoursElapsed);
      if (expGain > 0) {
        operations.push({
          type: 'cultivation_exp',
          value: expGain,
        });
      }

      // 感悟值：每小时10%概率获得1-5点
      const insightChance = 0.1 * hoursElapsed;
      if (Math.random() < insightChance) {
        const insightGain = Math.floor(1 + Math.random() * 5);
        operations.push({
          type: 'comprehension_insight',
          value: insightGain,
        });
      }
    }

    return operations;
  }

  /**
   * 计算材料掉落数量
   * @param hoursElapsed 历练小时数
   * @returns 材料数量
   */
  static calculateMaterialCount(hoursElapsed: number): number {
    return Math.floor(hoursElapsed / 3);
  }
}
