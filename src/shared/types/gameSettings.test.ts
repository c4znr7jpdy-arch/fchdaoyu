import {
  DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS,
  normalizeBattleAbilityStrategySettings,
  normalizeCultivatorGameSettings,
} from './gameSettings';

describe('game settings', () => {
  it('normalizes empty and invalid battle strategy settings to defaults', () => {
    expect(normalizeBattleAbilityStrategySettings(undefined)).toEqual(
      DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS,
    );
    expect(
      normalizeBattleAbilityStrategySettings({
        version: 2,
        mode: 'reckless',
      }),
    ).toEqual(DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS);
  });

  it('keeps emergency heal threshold under the heal skip threshold', () => {
    expect(
      normalizeBattleAbilityStrategySettings({
        version: 1,
        mode: 'balanced',
        healHpSkipThreshold: 0.4,
        emergencyHealHpThreshold: 0.8,
        restoreMpSkipThreshold: 0.6,
        avoidRepeatControl: true,
      }),
    ).toMatchObject({
      healHpSkipThreshold: 0.4,
      emergencyHealHpThreshold: 0.4,
    });
  });

  it('normalizes cultivator game settings without leaking invalid fields', () => {
    expect(
      normalizeCultivatorGameSettings({
        battleAbilityStrategy: {
          version: 1,
          mode: 'aggressive',
          healHpSkipThreshold: 0.7,
          emergencyHealHpThreshold: 0.25,
          restoreMpSkipThreshold: 0.5,
          avoidRepeatControl: false,
        },
        spiritStones: 999,
      }),
    ).toEqual({
      battleAbilityStrategy: {
        version: 1,
        mode: 'aggressive',
        healHpSkipThreshold: 0.7,
        emergencyHealHpThreshold: 0.25,
        restoreMpSkipThreshold: 0.5,
        avoidRepeatControl: false,
      },
    });
  });
});
