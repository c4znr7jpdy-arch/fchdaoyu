import { enemyGenerator } from '@shared/engine/enemyGenerator';
import type { Cultivator } from '@shared/types/cultivator';
import type {
  TaskDefinition,
  TaskInstanceMetadata,
  TaskStageDefinition,
} from '@shared/types/task';

type TaskLinkKind = 'alchemy' | 'dungeon' | 'retreat' | 'challenge' | 'tasks';

export interface TaskStageTemplate extends TaskStageDefinition {
  links: Array<{
    label: string;
    kind: TaskLinkKind;
  }>;
}

export interface BreakthroughTaskDefinition extends Omit<TaskDefinition, 'stages'> {
  taskTheme: TaskInstanceMetadata['taskTheme'];
  stages: TaskStageTemplate[];
}

export interface TaskChallengeProfile {
  id: string;
  title: string;
  buildOpponent: (cultivator: Cultivator) => Cultivator;
}

function cloneMirrorOpponent(
  cultivator: Cultivator,
  options: {
    name: string;
    attributeMultiplier: number;
    bonusWillpower?: number;
    bonusSpeed?: number;
  },
): Cultivator {
  const multiplier = options.attributeMultiplier;

  return {
    ...structuredClone(cultivator),
    id:
      globalThis.crypto?.randomUUID?.() ??
      `mirror-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: options.name,
    title: '劫影',
    attributes: {
      vitality: Math.max(1, Math.floor(cultivator.attributes.vitality * multiplier)),
      spirit: Math.max(1, Math.floor(cultivator.attributes.spirit * multiplier)),
      wisdom: Math.max(1, Math.floor(cultivator.attributes.wisdom * multiplier)),
      speed: Math.max(
        1,
        Math.floor(cultivator.attributes.speed * multiplier) + (options.bonusSpeed ?? 0),
      ),
      willpower: Math.max(
        1,
        Math.floor(cultivator.attributes.willpower * multiplier) +
          (options.bonusWillpower ?? 0),
      ),
    },
  };
}

function buildGeneratedChallengeOpponent(
  cultivator: Cultivator,
  options: {
    name: string;
    race: '灵族' | '魔族' | '古兽';
    difficulty: number;
  },
): Cultivator {
  return enemyGenerator.buildDraft({
    realm: cultivator.realm,
    realmStage: cultivator.realm_stage,
    race: options.race,
    difficulty: options.difficulty,
    isBoss: true,
    name: options.name,
    background: `${options.name}自劫光与魔念中凝形而出，只为阻断你的道途。`,
    description: `${options.name}杀机炽盛，专为破境试炼而来。`,
  }).cultivator;
}

const challengeProfiles: TaskChallengeProfile[] = [
  {
    id: 'heart_demon_nascent',
    title: '心魔劫',
    buildOpponent: (cultivator) =>
      cloneMirrorOpponent(cultivator, {
        name: '心魔化身',
        attributeMultiplier: 1.08,
        bonusWillpower: 6,
        bonusSpeed: 4,
      }),
  },
  {
    id: 'tribulation_deity',
    title: '化神之扰',
    buildOpponent: (cultivator) =>
      buildGeneratedChallengeOpponent(cultivator, {
        name: '天劫投影',
        race: '灵族',
        difficulty: 5,
      }),
  },
  {
    id: 'law_insight_void',
    title: '法则试锋',
    buildOpponent: (cultivator) =>
      buildGeneratedChallengeOpponent(cultivator, {
        name: '法则残影',
        race: '灵族',
        difficulty: 5,
      }),
  },
  {
    id: 'tribulation_body',
    title: '雷劫淬体',
    buildOpponent: (cultivator) =>
      buildGeneratedChallengeOpponent(cultivator, {
        name: '劫雷化身',
        race: '古兽',
        difficulty: 6,
      }),
  },
  {
    id: 'inner_demon_grand',
    title: '大执念劫',
    buildOpponent: (cultivator) =>
      cloneMirrorOpponent(cultivator, {
        name: '执念化身',
        attributeMultiplier: 1.12,
        bonusWillpower: 12,
        bonusSpeed: 6,
      }),
  },
  {
    id: 'heavenly_tribulation_final',
    title: '天劫前奏',
    buildOpponent: (cultivator) =>
      buildGeneratedChallengeOpponent(cultivator, {
        name: '天道劫影',
        race: '古兽',
        difficulty: 7,
      }),
  },
];

const definitions: BreakthroughTaskDefinition[] = [
  {
    id: 'major_breakthrough_炼气_筑基',
    category: 'breakthrough_major',
    title: '筑基前引',
    summary: '备妥筑基丹，再经药园试炼稳住根基，方可回静室冲击筑基。',
    fromRealm: '炼气',
    toRealm: '筑基',
    taskTheme: 'foundation',
    stages: [
      {
        id: 'foundation-pill',
        title: '备筑基丹',
        description: '先炼出一枚足以稳住药力的筑基丹，为液化灵气做准备。',
        completionText: '筑基丹已备妥，药力可引灵气归府。',
        links: [
          { label: '去炼丹房', kind: 'alchemy' },
          { label: '看任务中心', kind: 'tasks' },
        ],
        objectives: [
          {
            id: 'craft-pill',
            kind: 'craft_breakthrough_pill',
            title: '炼出筑基丹',
            description: '以破境丹炉意炼出可用于筑基的大丹。',
            targetRealm: '筑基',
          },
        ],
      },
      {
        id: 'foundation-trial',
        title: '闯废弃药园',
        description: '去血色禁地边缘的废弃药园走一遭，借险地灵机打磨根基。',
        completionText: '药园灵机已历，根基略稳。',
        links: [
          { label: '去云游探秘', kind: 'dungeon' },
          { label: '返回静室', kind: 'retreat' },
        ],
        objectives: [
          {
            id: 'clear-garden',
            kind: 'complete_dungeon',
            title: '通过落日森林·废弃药园',
            description: '完成一次药园历练，稳住破境前的根基与心神。',
            mapNodeId: 'SAT_TN_03',
            mapNodeName: '落日森林·废弃药园',
          },
        ],
      },
    ],
  },
  {
    id: 'major_breakthrough_筑基_金丹',
    category: 'breakthrough_major',
    title: '凝丹之机',
    summary: '丹药只是外力，先让功法与丹意都够得上，再去试炼阵中凝气成丹。',
    fromRealm: '筑基',
    toRealm: '金丹',
    taskTheme: 'core',
    stages: [
      {
        id: 'core-prep',
        title: '丹法并备',
        description: '结丹前需功法与丹药并进，两者缺一都会让丹田难以承受。',
        completionText: '丹药与功法已备，凝丹条件已成。',
        links: [
          { label: '去炼丹房', kind: 'alchemy' },
          { label: '看所修功法', kind: 'tasks' },
        ],
        objectives: [
          {
            id: 'craft-pill',
            kind: 'craft_breakthrough_pill',
            title: '炼出结丹丹药',
            description: '炼成一枚可用于结丹的大丹。',
            targetRealm: '金丹',
          },
          {
            id: 'quality-threshold',
            kind: 'technique_quality_at_least',
            title: '功法至少达玄品',
            description: '结丹更看道基深浅，所修最高功法需达到玄品。',
            threshold: '玄品',
          },
        ],
      },
      {
        id: 'core-trial',
        title: '过后山试炼阵',
        description: '前往黄枫谷后山禁地，以试炼阵压缩灵力，提前适应凝丹之势。',
        completionText: '试炼阵已过，丹田已能承压。',
        links: [
          { label: '去云游探秘', kind: 'dungeon' },
          { label: '返回静室', kind: 'retreat' },
        ],
        objectives: [
          {
            id: 'clear-trial',
            kind: 'complete_dungeon',
            title: '通过黄枫谷后山禁地',
            description: '完成一次结丹前试炼，验证功法与丹意能否并行。',
            mapNodeId: 'SAT_TN_04',
            mapNodeName: '越国·黄枫谷后山禁地',
          },
        ],
      },
    ],
  },
  {
    id: 'major_breakthrough_金丹_元婴',
    category: 'breakthrough_major',
    title: '婴劫问心',
    summary: '元婴之前，最难过的不是碎丹，而是先稳住道心、渡过心魔。',
    fromRealm: '金丹',
    toRealm: '元婴',
    taskTheme: 'heart_demon',
    stages: [
      {
        id: 'nascent-mind',
        title: '先清心',
        description: '以清心类丹药或机缘安定识海，否则心魔一来便会神魂失守。',
        completionText: '识海已稳，杂念稍歇。',
        links: [
          { label: '去炼丹房', kind: 'alchemy' },
          { label: '看任务中心', kind: 'tasks' },
        ],
        objectives: [
          {
            id: 'clear-mind',
            kind: 'status_active',
            title: '具备清心准备',
            description: '当前身上需有清心状态，方可应对心魔幻境。',
            statusKey: 'clear_mind',
          },
        ],
      },
      {
        id: 'nascent-heart-demon',
        title: '渡心魔劫',
        description: '进入识海深处，与心魔化身正面一战，胜则元婴可期。',
        completionText: '心魔已斩，道心尚存。',
        links: [
          { label: '进入试炼', kind: 'challenge' },
          { label: '返回静室', kind: 'retreat' },
        ],
        objectives: [
          {
            id: 'win-heart-demon',
            kind: 'win_task_challenge',
            title: '战胜心魔化身',
            description: '赢下这一战，才能真正获得冲击元婴的资格。',
            challengeId: 'heart_demon_nascent',
          },
        ],
      },
    ],
  },
  {
    id: 'major_breakthrough_元婴_化神',
    category: 'breakthrough_major',
    title: '斩执念，叩化神',
    summary: '化神之前，要先备护脉与清心，再去旧址断执，最后直面天劫投影。',
    fromRealm: '元婴',
    toRealm: '化神',
    taskTheme: 'tribulation',
    stages: [
      {
        id: 'deity-prep',
        title: '护脉清心',
        description: '护脉与清心都不可少，少一分准备，化神反噬便会重一分。',
        completionText: '道体与识海都已做足准备。',
        links: [
          { label: '去炼丹房', kind: 'alchemy' },
          { label: '返回静室', kind: 'retreat' },
        ],
        objectives: [
          {
            id: 'protect-meridians',
            kind: 'status_active',
            title: '具备护脉准备',
            description: '当前身上需有护脉状态，以减轻破境时的经脉反噬。',
            statusKey: 'protect_meridians',
          },
          {
            id: 'clear-mind',
            kind: 'status_active',
            title: '具备清心准备',
            description: '当前身上需有清心状态，以免化神时神识动摇。',
            statusKey: 'clear_mind',
          },
        ],
      },
      {
        id: 'deity-trial',
        title: '断旧执',
        description: '去天机阁旧址看破旧念，以残卷与星象印证自己的道途。',
        completionText: '旧执已断，道念更明。',
        links: [
          { label: '去云游探秘', kind: 'dungeon' },
          { label: '进入试炼', kind: 'challenge' },
        ],
        objectives: [
          {
            id: 'clear-archive',
            kind: 'complete_dungeon',
            title: '通过天机阁旧址',
            description: '完成一次旧址历练，以断执念、稳道心。',
            mapNodeId: 'SAT_DJ_07',
            mapNodeName: '大晋·天机阁旧址',
          },
          {
            id: 'win-tribulation',
            kind: 'win_task_challenge',
            title: '战胜天劫投影',
            description: '正面扛过化神前的天劫投影，方可回静室正式冲关。',
            challengeId: 'tribulation_deity',
          },
        ],
      },
    ],
  },
  {
    id: 'major_breakthrough_化神_炼虚',
    category: 'breakthrough_major',
    title: '法则初窥',
    summary: '想破入炼虚，先把感悟推高，再去险地印证法则，最后战胜法则残影。',
    fromRealm: '化神',
    toRealm: '炼虚',
    taskTheme: 'law_insight',
    stages: [
      {
        id: 'void-insight',
        title: '补足感悟',
        description: '法则门槛极高，没有足够感悟便看不见炼虚门槛。',
        completionText: '感悟已足，可试着碰触法则边缘。',
        links: [
          { label: '返回静室', kind: 'retreat' },
          { label: '看任务中心', kind: 'tasks' },
        ],
        objectives: [
          {
            id: 'insight',
            kind: 'insight_at_least',
            title: '感悟达到 70',
            description: '先把感悟积累到足够高，再谈炼虚。',
            threshold: 70,
          },
        ],
      },
      {
        id: 'void-trial',
        title: '入古魔祭坛群',
        description: '在古魔祭坛群中正视混乱法则，再与法则残影交手。',
        completionText: '祭坛群与法则残影都已渡过。',
        links: [
          { label: '去云游探秘', kind: 'dungeon' },
          { label: '进入试炼', kind: 'challenge' },
        ],
        objectives: [
          {
            id: 'clear-altar',
            kind: 'complete_dungeon',
            title: '通过古魔祭坛群',
            description: '完成一次高危法则历练。',
            mapNodeId: 'SAT_TN_06',
            mapNodeName: '坠魔谷·古魔祭坛群',
          },
          {
            id: 'win-law-challenge',
            kind: 'win_task_challenge',
            title: '战胜法则残影',
            description: '只有在正面对抗中稳住法则，才算真正摸到炼虚门槛。',
            challengeId: 'law_insight_void',
          },
        ],
      },
    ],
  },
  {
    id: 'major_breakthrough_炼虚_合体',
    category: 'breakthrough_major',
    title: '雷劫淬体',
    summary: '炼虚之后，道体先承雷，再谈合体。准备、试炼与雷劫都不可省。',
    fromRealm: '炼虚',
    toRealm: '合体',
    taskTheme: 'tribulation',
    stages: [
      {
        id: 'body-prep',
        title: '稳道体',
        description: '道体不稳，合体之前先被雷劫撕碎。',
        completionText: '道体准备已足，足可尝试承雷。',
        links: [
          { label: '返回静室', kind: 'retreat' },
          { label: '去炼丹房', kind: 'alchemy' },
        ],
        objectives: [
          {
            id: 'insight',
            kind: 'insight_at_least',
            title: '感悟达到 75',
            description: '更高层次的感悟能稳住神识与道体。',
            threshold: 75,
          },
          {
            id: 'protect-meridians',
            kind: 'status_active',
            title: '具备护脉准备',
            description: '护脉状态能让道体更稳，降低合体前反噬。',
            statusKey: 'protect_meridians',
          },
        ],
      },
      {
        id: 'body-trial',
        title: '入镇魔古塔',
        description: '先过镇魔古塔，再与劫雷化身交锋，验证道体是否真能承压。',
        completionText: '古塔与劫雷都已承住。',
        links: [
          { label: '去云游探秘', kind: 'dungeon' },
          { label: '进入试炼', kind: 'challenge' },
        ],
        objectives: [
          {
            id: 'clear-tower',
            kind: 'complete_dungeon',
            title: '通过镇魔古塔',
            description: '借塔灵与封印反噬打磨道体。',
            mapNodeId: 'SAT_DJ_06',
            mapNodeName: '昆吾山·镇魔古塔',
          },
          {
            id: 'win-body-challenge',
            kind: 'win_task_challenge',
            title: '战胜劫雷化身',
            description: '在雷劫压身之下仍能胜出，才配迈入合体。',
            challengeId: 'tribulation_body',
          },
        ],
      },
    ],
  },
  {
    id: 'major_breakthrough_合体_大乘',
    category: 'breakthrough_major',
    title: '大执念关',
    summary: '越往后越不是灵力之争，而是执念与道心之争。',
    fromRealm: '合体',
    toRealm: '大乘',
    taskTheme: 'heart_demon',
    stages: [
      {
        id: 'grand-prep',
        title: '先稳心神',
        description: '若不能先稳住心神，大乘门前最容易被执念反噬。',
        completionText: '心神已定，可入更深层试炼。',
        links: [
          { label: '去炼丹房', kind: 'alchemy' },
          { label: '返回静室', kind: 'retreat' },
        ],
        objectives: [
          {
            id: 'insight',
            kind: 'insight_at_least',
            title: '感悟达到 80',
            description: '更深的感悟能削弱执念纠缠。',
            threshold: 80,
          },
          {
            id: 'clear-mind',
            kind: 'status_active',
            title: '具备清心准备',
            description: '以清心状态稳住神识，不被执念拉回旧路。',
            statusKey: 'clear_mind',
          },
        ],
      },
      {
        id: 'grand-trial',
        title: '闯逆鳞祭坛',
        description: '先过逆鳞祭坛，再斩执念化身，方能真正逼近大乘门槛。',
        completionText: '逆鳞与执念都已越过。',
        links: [
          { label: '去云游探秘', kind: 'dungeon' },
          { label: '进入试炼', kind: 'challenge' },
        ],
        objectives: [
          {
            id: 'clear-altar',
            kind: 'complete_dungeon',
            title: '通过逆鳞祭坛',
            description: '以古龙逆鳞磨炼道心与意志。',
            mapNodeId: 'SAT_DJ_02',
            mapNodeName: '玄黄裂渊·逆鳞祭坛',
          },
          {
            id: 'win-grand-challenge',
            kind: 'win_task_challenge',
            title: '战胜执念化身',
            description: '若连自身执念都压不下，大乘只会是一句空谈。',
            challengeId: 'inner_demon_grand',
          },
        ],
      },
    ],
  },
  {
    id: 'major_breakthrough_大乘_渡劫',
    category: 'breakthrough_major',
    title: '渡劫前奏',
    summary: '真正踏入渡劫前，要先承住前奏，确认自己没有被天道一击抹去。',
    fromRealm: '大乘',
    toRealm: '渡劫',
    taskTheme: 'tribulation',
    stages: [
      {
        id: 'tribulation-prep',
        title: '备渡劫身',
        description: '渡劫之前，护脉与清心都要到位，否则一击之下形神俱散。',
        completionText: '形神两端都已尽量稳住。',
        links: [
          { label: '去炼丹房', kind: 'alchemy' },
          { label: '返回静室', kind: 'retreat' },
        ],
        objectives: [
          {
            id: 'insight',
            kind: 'insight_at_least',
            title: '感悟达到 85',
            description: '先让感悟足够深，再去摸渡劫门槛。',
            threshold: 85,
          },
          {
            id: 'protect-meridians',
            kind: 'status_active',
            title: '具备护脉准备',
            description: '护脉状态能减轻渡劫前的道体崩裂风险。',
            statusKey: 'protect_meridians',
          },
          {
            id: 'clear-mind',
            kind: 'status_active',
            title: '具备清心准备',
            description: '清心状态能降低渡劫前的识海震荡。',
            statusKey: 'clear_mind',
          },
        ],
      },
      {
        id: 'tribulation-trial',
        title: '入沉日神殿',
        description: '先穿沉日神殿，再直面天道劫影，证明自己不会在第一道劫火下碎灭。',
        completionText: '神殿与天道劫影都已压过去。',
        links: [
          { label: '去云游探秘', kind: 'dungeon' },
          { label: '进入试炼', kind: 'challenge' },
        ],
        objectives: [
          {
            id: 'clear-temple',
            kind: 'complete_dungeon',
            title: '通过沉日神殿',
            description: '在深海神殿中验证自己是否真能承住天威。',
            mapNodeId: 'SAT_DJ_03',
            mapNodeName: '九幽冥海·沉日神殿',
          },
          {
            id: 'win-final-challenge',
            kind: 'win_task_challenge',
            title: '战胜天道劫影',
            description: '若连天劫前奏都扛不住，便还不到正式渡劫的时候。',
            challengeId: 'heavenly_tribulation_final',
          },
        ],
      },
    ],
  },
];

const definitionMap = new Map(definitions.map((definition) => [definition.id, definition]));
const challengeProfileMap = new Map(
  challengeProfiles.map((profile) => [profile.id, profile]),
);

export function getBreakthroughTaskDefinition(definitionId: string) {
  return definitionMap.get(definitionId) ?? null;
}

export function getBreakthroughTaskDefinitionByTransition(
  fromRealm: BreakthroughTaskDefinition['fromRealm'],
  toRealm: BreakthroughTaskDefinition['toRealm'],
) {
  return (
    definitions.find(
      (definition) =>
        definition.fromRealm === fromRealm && definition.toRealm === toRealm,
    ) ?? null
  );
}

export function getTaskChallengeProfile(challengeId: string) {
  return challengeProfileMap.get(challengeId) ?? null;
}
