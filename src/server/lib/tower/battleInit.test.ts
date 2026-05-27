import { BASIC_SKILLS, BASIC_TECHNIQUES } from '@shared/engine/cultivator/creation/config';
import type { CultivatorCondition } from '@shared/types/condition';
import type { Cultivator } from '@shared/types/cultivator';
import { describe, expect, it } from 'vitest';
import { ConditionService } from '@server/lib/services/ConditionService';
import {
  applyTowerBattleOutcome,
  buildTowerBattleInit,
} from './battleInit';

function createCultivator(): Cultivator {
  return {
    id: 'cultivator-1',
    name: '韩立',
    title: null,
    gender: '男',
    realm: '筑基',
    realm_stage: '中期',
    age: 40,
    lifespan: 260,
    attributes: {
      vitality: 52,
      spirit: 58,
      wisdom: 50,
      speed: 48,
      willpower: 44,
    },
    spiritual_roots: [{ element: '木', strength: 82 }],
    pre_heaven_fates: [],
    cultivations: [BASIC_TECHNIQUES.木()],
    skills: [...BASIC_SKILLS.木],
    inventory: {
      artifacts: [],
      consumables: [],
      materials: [],
    },
    equipped: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    max_skills: 4,
    spirit_stones: 0,
    background: '测试角色',
  };
}

function createCondition(overrides: Partial<CultivatorCondition> = {}): CultivatorCondition {
  return {
    version: 1,
    resources: {
      hp: { current: 9999 },
      mp: { current: 9999 },
    },
    gauges: { pillToxicity: 0 },
    tracks: {
      tempering: {
        vitality: { level: 0, progress: 0 },
        spirit: { level: 0, progress: 0 },
        wisdom: { level: 0, progress: 0 },
        speed: { level: 0, progress: 0 },
        willpower: { level: 0, progress: 0 },
      },
      marrowWash: { level: 0, progress: 0 },
    },
    counters: {
      longTermPillUsesByRealm: {},
      cultivationPillUsesByRealm: {},
    },
    statuses: [],
    timestamps: {
      lastRecoveryAt: '2026-05-26T00:00:00.000Z',
    },
    metrics: {
      totalRecoveredHp: 0,
      totalRecoveredMp: 0,
    },
    ...overrides,
  };
}

describe('tower battle init', () => {
  it('clamps tower resources to the live character cap and applies recoveries plus modifiers', () => {
    const cultivator = createCultivator();
    const { maxHp, maxMp } = ConditionService.getMaxResources(cultivator);
    const condition = createCondition({
      resources: {
        hp: { current: maxHp - 80 },
        mp: { current: maxMp + 60 },
      },
    });

    const result = buildTowerBattleInit({
      cultivator,
      condition,
      blessings: {
        breathing_technique: 2,
        meridian_cycle: 1,
        jade_bones: 1,
      },
      encounterKind: 'elite',
    });

    expect(result.normalizedCondition.resources.hp.current).toBe(maxHp - 80);
    expect(result.normalizedCondition.resources.mp.current).toBe(maxMp);
    expect(result.battleInit.player?.resourceState?.hp?.mode).toBe('absolute');
    expect(result.battleInit.player?.resourceState?.hp?.value).toBeGreaterThan(
      result.normalizedCondition.resources.hp.current,
    );
    expect(result.battleInit.player?.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ attrType: 'maxHp', value: 1.1 }),
      ]),
    );
    expect(result.battleInit.opponent?.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ attrType: 'maxHp', value: 1.18 }),
      ]),
    );
  });

  it('marks defeat as near death without natural recovery', () => {
    const cultivator = createCultivator();
    const condition = createCondition({
      resources: {
        hp: { current: 120 },
        mp: { current: 45 },
      },
    });

    const nextCondition = applyTowerBattleOutcome({
      cultivator,
      condition,
      playerSnapshot: {
        hp: { current: 0, max: 0, percent: 0 },
        mp: { current: 0, max: 0, percent: 0 },
        shield: 0,
        alive: false,
        buffs: [],
      } as any,
      didLose: true,
      now: new Date('2026-05-26T12:00:00.000Z'),
    });

    expect(nextCondition.resources.hp.current).toBe(1);
    expect(nextCondition.resources.mp.current).toBe(0);
    expect(nextCondition.statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'near_death' }),
      ]),
    );
  });
});
