import {
  buildDungeonBattleInit,
  buildPersistentStatus,
  incrementOrInsertStatus,
  promoteInjuryStatus,
} from './battleInit';

describe('dungeon battle init helpers', () => {
  test('副本战斗不从 run state 注入角色气血、法力或状态', () => {
    const battleInit = buildDungeonBattleInit();

    expect(battleInit).toEqual({});
  });

  test('weakness 可叠层，伤势会按轻伤→重伤→濒死晋级', () => {
    const weaknessStatuses = incrementOrInsertStatus([], 'weakness', 2);
    const stackedWeakness = incrementOrInsertStatus(
      weaknessStatuses,
      'weakness',
      3,
    );

    expect(stackedWeakness[0].stacks).toBe(5);

    const minor = promoteInjuryStatus([]);
    const major = promoteInjuryStatus(minor);
    const nearDeath = promoteInjuryStatus(major);

    expect(minor.map((status) => status.key)).toEqual(['minor_wound']);
    expect(major.map((status) => status.key)).toEqual(['major_wound']);
    expect(nearDeath.map((status) => status.key)).toEqual([
      'near_death',
    ]);
  });
});
