import type { BattleInitConfigV5 } from '@shared/engine/battle-v5/setup/types';
import type { Cultivator } from '@shared/types/cultivator';

export function withPlayerAbilityStrategySettings(
  initConfig: BattleInitConfigV5 | undefined,
  cultivator: Cultivator,
): BattleInitConfigV5 | undefined {
  const strategySettings = cultivator.gameSettings?.battleAbilityStrategy;
  if (!strategySettings) {
    return initConfig;
  }

  return {
    ...initConfig,
    player: {
      ...initConfig?.player,
      selectionStrategySettings: strategySettings,
    },
  };
}
