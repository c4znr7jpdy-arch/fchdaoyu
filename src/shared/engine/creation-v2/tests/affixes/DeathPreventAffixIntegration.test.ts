import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { composeProductFromAffixIds } from '@shared/engine/creation-v2/composeProductFromAffixIds';
import { projectAbilityConfig } from '@shared/engine/creation-v2/models/AbilityProjection';
import { EventBus } from '@shared/engine/battle-v5/core/EventBus';
import type {
  DamageRequestEvent,
  UnitDeadEvent,
} from '@shared/engine/battle-v5/core/events';
import {
  AttributeType,
  DamageSource,
  DamageType,
} from '@shared/engine/battle-v5/core/types';
import { AbilityFactory } from '@shared/engine/battle-v5/factories/AbilityFactory';
import { DamageSystem } from '@shared/engine/battle-v5/systems/DamageSystem';
import { Unit } from '@shared/engine/battle-v5/units/Unit';

describe('death_prevent artifact affix integration', () => {
  beforeEach(() => {
    EventBus.instance.reset();
  });

  afterEach(() => {
    EventBus.instance.reset();
  });

  function createUnit(id: string, name: string): Unit {
    return new Unit(id, name, {
      [AttributeType.SPIRIT]: 100,
      [AttributeType.VITALITY]: 100,
      [AttributeType.SPEED]: 100,
      [AttributeType.WILLPOWER]: 100,
      [AttributeType.WISDOM]: 100,
    });
  }

  it('替身纸人投影的 death_prevent 应在致命受击窗口触发', () => {
    const attacker = createUnit('attacker', '破阵者');
    const defender = createUnit('defender', '持符者');
    const damageSystem = new DamageSystem();
    let deathEvent: UnitDeadEvent | undefined;

    EventBus.instance.subscribe<UnitDeadEvent>('UnitDeadEvent', (event) => {
      deathEvent = event;
    });

    const artifact = composeProductFromAffixIds({
      productType: 'artifact',
      element: '金',
      name: '替身甲',
      requestedSlot: 'armor',
      affixIds: ['artifact-defense-death-prevent'],
    });
    const abilityConfig = projectAbilityConfig(artifact);

    expect(abilityConfig.listeners?.[0]?.guard).toMatchObject({
      allowLethalWindow: true,
    });

    defender.abilities.addAbility(AbilityFactory.create(abilityConfig));

    EventBus.instance.publish<DamageRequestEvent>({
      type: 'DamageRequestEvent',
      timestamp: Date.now(),
      caster: attacker,
      target: defender,
      damageSource: DamageSource.DIRECT,
      damageType: DamageType.TRUE,
      baseDamage: 1_000_000,
      finalDamage: 1_000_000,
    });

    expect(defender.getCurrentHp()).toBe(1);
    expect(defender.isAlive()).toBe(true);
    expect(deathEvent).toBeUndefined();
    expect(
      EventBus.instance
        .getEventHistory()
        .some((event) => event.type === 'DeathPreventEvent'),
    ).toBe(true);

    damageSystem.destroy();
  });
});
