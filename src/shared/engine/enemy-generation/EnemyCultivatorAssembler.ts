import {
  EnemyRace,
  GENDER_VALUES,
  REALM_ORDER,
  REALM_STAGE_CAPS,
} from '@shared/types/constants';
import type {
  Attributes,
  Cultivator,
  SpiritualRoot,
} from '@shared/types/cultivator';
import type {
  EnemyCraftedLoadout,
  EnemyRaceProfile,
  NormalizedEnemyGenerationInput,
} from './types';
import { hashText } from './utils';

export class EnemyCultivatorAssembler {
  assemble(args: {
    variantKey: string;
    input: NormalizedEnemyGenerationInput;
    profile: EnemyRaceProfile;
    primaryElement: EnemyCraftedLoadout['primaryElement'];
    attributes: Attributes;
    name: string;
    background: string;
    description: string;
    loadout: EnemyCraftedLoadout;
  }): Cultivator {
    const {
      variantKey,
      input,
      primaryElement,
      attributes,
      name,
      background,
      description,
      loadout,
    } = args;

    const equipped = {
      weapon:
        loadout.artifacts.find((artifact) => artifact.item.slot === 'weapon')?.item.id ??
        null,
      armor:
        loadout.artifacts.find((artifact) => artifact.item.slot === 'armor')?.item.id ??
        null,
      accessory:
        loadout.artifacts.find(
          (artifact) => artifact.item.slot === 'accessory',
        )?.item.id ?? null,
    };

    const rootStrengthBonus = {
      灵族: 12,
      古兽: 10,
      鬼魂: 6,
    } as Record<EnemyRace, number>;

    const spiritualRoots: SpiritualRoot[] = [
      {
        element: primaryElement,
        strength: Math.min(
          100,
          Math.round(
            48 +
              input.difficulty * 0.45 +
              (REALM_ORDER[input.realm] ?? 0) * 2 +
              (rootStrengthBonus[input.race] ?? 0),
          ),
        ),
      },
    ];

    const gender = GENDER_VALUES[
      hashText(`${variantKey}:gender`) %
        GENDER_VALUES.length
    ];

    return {
      id: `enemy:${variantKey}`,
      name,
      title: null,
      gender,
      race: input.race,
      realm: input.realm,
      realm_stage: input.realmStage,
      age: 30 + REALM_ORDER[input.realm] * 45 + (input.difficulty % 20),
      lifespan: 150 + REALM_STAGE_CAPS[input.realm][input.realmStage] * 6,
      attributes,
      spiritual_roots: spiritualRoots,
      pre_heaven_fates: [],
      cultivations: [loadout.technique.item],
      skills: loadout.skills.map((entry) => entry.item),
      inventory: {
        artifacts: loadout.artifacts.map((entry) => entry.item),
        consumables: [],
        materials: [],
      },
      equipped,
      max_skills: Math.max(6, loadout.skills.length + 1),
      spirit_stones: 0,
      background,
      description,
    };
  }
}
