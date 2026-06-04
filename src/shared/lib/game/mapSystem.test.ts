import { describe, expect, it } from 'vitest';
import type { DungeonDifficultyTier, MapNodeInfo } from './mapSystem';
import {
  getAllMapNodes,
  getAllSatelliteNodes,
  resolveDungeonMapConfig,
  scaleDungeonBattleDifficulty,
} from './mapSystem';

function createNode(
  difficulty?: DungeonDifficultyTier,
): MapNodeInfo {
  return {
    id: 'test-node',
    name: '测试秘境',
    region: '测试',
    realm_requirement: '筑基',
    tags: [],
    description: '',
    connections: [],
    x: 0,
    y: 0,
    ...(difficulty ? { dungeon_config: { difficulty } } : {}),
  };
}

describe('resolveDungeonMapConfig', () => {
  it('defaults old map nodes to normal difficulty', () => {
    expect(resolveDungeonMapConfig(createNode())).toMatchObject({
      realmRequirement: '筑基',
      difficultyTier: 'normal',
      difficultyLabel: '普通',
      enemyDifficultyMultiplier: 0.5,
      maxEnemyDifficulty: 50,
      allowBossLoadout: false,
    });
  });

  it.each([
    ['easy', '低危', 0.35, 35, false],
    ['normal', '普通', 0.5, 50, false],
    ['hard', '险地', 0.65, 70, false],
    ['elite', '凶险', 0.8, 85, true],
    ['boss', '绝境', 0.95, 100, true],
  ] as const)(
    'resolves %s difficulty preset',
    (tier, label, multiplier, cap, allowBossLoadout) => {
      expect(resolveDungeonMapConfig(createNode(tier))).toMatchObject({
        difficultyTier: tier,
        difficultyLabel: label,
        enemyDifficultyMultiplier: multiplier,
        maxEnemyDifficulty: cap,
        allowBossLoadout,
      });
    },
  );

  it('scales and caps battle difficulty by map preset', () => {
    const easy = resolveDungeonMapConfig(createNode('easy'));
    const boss = resolveDungeonMapConfig(createNode('boss'));

    expect(scaleDungeonBattleDifficulty(100, easy)).toBe(35);
    expect(scaleDungeonBattleDifficulty(100, boss)).toBe(95);
    expect(scaleDungeonBattleDifficulty(200, boss)).toBe(100);
    expect(scaleDungeonBattleDifficulty(-20, easy)).toBe(0);
  });

  it('keeps curated map data explicitly classified', () => {
    const nodes = [...getAllMapNodes(), ...getAllSatelliteNodes()];

    expect(nodes.every((node) => node.dungeon_config?.difficulty)).toBe(true);
    expect(
      resolveDungeonMapConfig(
        nodes.find((node) => node.id === 'TN_YUE_01')!,
      ).difficultyLabel,
    ).toBe('低危');
    expect(
      resolveDungeonMapConfig(
        nodes.find((node) => node.id === 'LX_VOID_01')!,
      ).difficultyLabel,
    ).toBe('凶险');
    expect(
      resolveDungeonMapConfig(
        nodes.find((node) => node.id === 'DJ_KW_01')!,
      ).difficultyLabel,
    ).toBe('绝境');
  });
});
