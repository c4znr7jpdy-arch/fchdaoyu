import type { Cultivator } from '@shared/types/cultivator';
import { simulateBattleV5 } from '@server/lib/services/simulateBattleV5';
import { BuffType, ModifierType, AttributeType } from '../../core/types';
import { StackRule } from '../../buffs/Buff';
import { BuffFactory } from '../../factories/BuffFactory';
import { createBattleUnitsWithInit } from '../../setup/BattleInitApplier';
import { EventBus } from '../../core/EventBus';
import { ActionEvent, SkillPreCastEvent } from '../../core/events';
import { ActiveSkill } from '../../abilities/ActiveSkill';
import { AbilityId } from '../../core/types';
import { TargetPolicy } from '../../abilities/TargetPolicy';
import { GameplayTags } from '@shared/engine/shared/tag-domain';

function createCultivator(id: string, name: string): Cultivator {
  return {
    id,
    name,
    age: 18,
    lifespan: 120,
    attributes: {
      vitality: 10,
      spirit: 10,
      wisdom: 10,
      speed: 10,
      willpower: 10,
    },
    spiritual_roots: [],
    pre_heaven_fates: [],
    cultivations: [],
    skills: [],
    inventory: { artifacts: [], consumables: [], materials: [] },
    equipped: { weapon: null, armor: null, accessory: null },
    max_skills: 0,
    spirit_stones: 0,
    gender: '男',
    realm: '炼气',
    realm_stage: '初期',
  };
}

class InitHealSkill extends ActiveSkill {
  constructor() {
    super('init_heal_skill' as AbilityId, '初始化治疗', {
      targetPolicy: TargetPolicy.self(),
      priority: 100,
      selectionProfile: { intents: ['heal_hp'] },
    });
    this.tags.addTags([GameplayTags.ABILITY.FUNCTION.HEAL]);
  }
  protected executeSkill(): void {}
}

class InitDamageSkill extends ActiveSkill {
  constructor() {
    super('init_damage_skill' as AbilityId, '初始化伤害', {
      targetPolicy: TargetPolicy.default(),
      priority: 50,
      selectionProfile: { intents: ['damage'] },
    });
    this.tags.addTags([GameplayTags.ABILITY.FUNCTION.DAMAGE]);
  }
  protected executeSkill(): void {}
}

describe('BattleInitApplier', () => {
  test('MAX_HP 初始化 modifier 在 buff 触发派生刷新后仍保持有效', () => {
    const player = createCultivator('player', '道友');
    const opponent = createCultivator('dummy', '木桩');

    const { playerUnit, opponentUnit } = createBattleUnitsWithInit(
      player,
      opponent,
      {
        opponent: {
          modifiers: [
            {
              attrType: AttributeType.MAX_HP,
              type: ModifierType.OVERRIDE,
              value: 10_000_000,
            },
          ],
          resourceState: {
            hp: { mode: 'absolute', value: 10_000_000 },
          },
        },
      },
    );

    const vitalityBuff = BuffFactory.create({
      id: 'training_vitality_up',
      name: '体魄加成',
      type: BuffType.BUFF,
      duration: 3,
      stackRule: StackRule.REFRESH_DURATION,
      modifiers: [
        {
          attrType: AttributeType.VITALITY,
          type: ModifierType.FIXED,
          value: 20,
        },
      ],
    });

    opponentUnit.buffs.addBuff(vitalityBuff, playerUnit);

    expect(opponentUnit.getMaxHp()).toBe(10_000_000);
    expect(opponentUnit.getCurrentHp()).toBe(10_000_000);
  });

  test('状态模板与资源状态按统一顺序初始化，当前气血基于最终上限结算', () => {
    const player = createCultivator('player', '道友');
    const opponent = createCultivator('dummy', '木桩');

    const { opponentUnit } = createBattleUnitsWithInit(player, opponent, {
      opponent: {
        modifiers: [
          {
            attrType: AttributeType.MAX_HP,
            type: ModifierType.FIXED,
            value: 100,
          },
        ],
        statusRefs: [
          {
            version: 1,
            templateId: 'minor_wound',
            stacks: 1,
          },
        ],
        resourceState: {
          hp: { mode: 'percent', value: 0.5 },
        },
      },
    });

    expect(opponentUnit.getMaxHp()).toBe(414);
    expect(opponentUnit.getCurrentHp()).toBe(207);
  });

  test('状态录制中的 maxHp 底座与修正值能正确区分', () => {
    const player = createCultivator('player', '道友');
    const opponent = createCultivator('dummy', '木桩');

    const result = simulateBattleV5(player, opponent, {
      opponent: {
        modifiers: [
          {
            attrType: AttributeType.MAX_HP,
            type: ModifierType.OVERRIDE,
            value: 1_000,
          },
        ],
        resourceState: {
          hp: { mode: 'absolute', value: 1_000 },
        },
      },
    });

    const initFrame = result.stateTimeline.frames[0].units.dummy;

    expect(initFrame.baseAttrs.maxHp).toBe(360);
    expect(initFrame.attrs.maxHp).toBe(1_000);
    expect(initFrame.hp.current).toBe(1_000);
  });

  test('selectionStrategySettings 会注入玩家技能选择策略', () => {
    const eventBus = EventBus.instance;
    eventBus.reset();

    const player = createCultivator('player', '道友');
    const opponent = createCultivator('dummy', '木桩');
    const { playerUnit, opponentUnit } = createBattleUnitsWithInit(
      player,
      opponent,
      {
        player: {
          resourceState: {
            hp: { mode: 'percent', value: 0.65 },
          },
          selectionStrategySettings: {
            version: 1,
            mode: 'conservative',
            healHpSkipThreshold: 0.9,
            emergencyHealHpThreshold: 0.7,
            restoreMpSkipThreshold: 0.75,
            avoidRepeatControl: true,
          },
        },
      },
    );
    playerUnit.abilities.setDefaultTarget(opponentUnit);
    playerUnit.abilities.addAbility(new InitHealSkill());
    playerUnit.abilities.addAbility(new InitDamageSkill());

    let capturedAbilityId: string | null = null;
    eventBus.subscribe<SkillPreCastEvent>('SkillPreCastEvent', (event) => {
      capturedAbilityId = event.ability.id;
    });

    eventBus.publish<ActionEvent>({
      type: 'ActionEvent',
      timestamp: Date.now(),
      caster: playerUnit,
    });

    expect(capturedAbilityId).toBe('init_heal_skill');
    eventBus.reset();
  });
});
