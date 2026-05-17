import { cn } from '@shared/lib/cn';
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type DungeonSceneDensity = 'card' | 'wide' | 'full' | 'centered';

type DungeonSceneBackAction = {
  label: string;
  href: string;
};

export interface DungeonSceneDescriptor {
  sceneLabel: string;
  subtitle?: string;
  backAction: DungeonSceneBackAction;
  density: DungeonSceneDensity;
  loadingMessage: string;
}

type DungeonSceneState =
  | 'loading'
  | 'not_authenticated'
  | 'map_selection'
  | 'exploring'
  | 'battle_preparation'
  | 'in_battle'
  | 'looting'
  | 'settlement';

const dungeonSceneDescriptors: Record<DungeonSceneState, DungeonSceneDescriptor> = {
  loading: {
    sceneLabel: '云游探秘',
    subtitle: '天机混沌，正在重整历练轨迹。',
    backAction: {
      label: '返回洞府',
      href: '/game',
    },
    density: 'centered',
    loadingMessage: '天机混沌，正在解析……',
  },
  not_authenticated: {
    sceneLabel: '云游探秘',
    subtitle: '此处机缘需真身在场方可接引。',
    backAction: {
      label: '返回洞府',
      href: '/game',
    },
    density: 'centered',
    loadingMessage: '请先凝聚真身。',
  },
  map_selection: {
    sceneLabel: '云游探秘',
    subtitle: '择一处秘境，定此行的起点与气数。',
    backAction: {
      label: '返回洞府',
      href: '/game',
    },
    density: 'wide',
    loadingMessage: '正在搜寻可入秘境……',
  },
  exploring: {
    sceneLabel: '历练途中',
    subtitle: '前路气机骤变，每一步都在改变结局。',
    backAction: {
      label: '返回洞府',
      href: '/game',
    },
    density: 'card',
    loadingMessage: '正在推演下一回合……',
  },
  battle_preparation: {
    sceneLabel: '遭遇战',
    subtitle: '敌息逼近，先辨虚实，再决生死。',
    backAction: {
      label: '结束历练',
      href: '/game',
    },
    density: 'card',
    loadingMessage: '正在探查敌手……',
  },
  in_battle: {
    sceneLabel: '副本战斗',
    subtitle: '此战胜负，直接改写此行所获。',
    backAction: {
      label: '结束历练',
      href: '/game',
    },
    density: 'full',
    loadingMessage: '战局演算中……',
  },
  looting: {
    sceneLabel: '战后休整',
    subtitle: '余波未散，决定是继续深入，还是及时收手。',
    backAction: {
      label: '返回洞府',
      href: '/game',
    },
    density: 'card',
    loadingMessage: '正在整理战后余波……',
  },
  settlement: {
    sceneLabel: '探索结束',
    subtitle: '尘埃落定，此行所得已可回带洞府。',
    backAction: {
      label: '返回洞府',
      href: '/game',
    },
    density: 'wide',
    loadingMessage: '正在清点机缘……',
  },
};

const defaultDungeonSceneDescriptor = dungeonSceneDescriptors.map_selection;

interface DungeonSceneContextValue {
  descriptor: DungeonSceneDescriptor;
  setDescriptor: (next: DungeonSceneDescriptor) => void;
}

const DungeonSceneContext = createContext<DungeonSceneContextValue | null>(null);

export function resolveDungeonSceneDescriptor(state: DungeonSceneState) {
  return dungeonSceneDescriptors[state];
}

export function DungeonSceneProvider({ children }: { children: ReactNode }) {
  const [descriptor, setDescriptor] = useState<DungeonSceneDescriptor>(
    defaultDungeonSceneDescriptor,
  );
  const value = useMemo(
    () => ({
      descriptor,
      setDescriptor,
    }),
    [descriptor],
  );

  return (
    <DungeonSceneContext.Provider value={value}>
      {children}
    </DungeonSceneContext.Provider>
  );
}

function useDungeonSceneContext() {
  const context = useContext(DungeonSceneContext);

  if (!context) {
    throw new Error('dungeon scene hooks must be used within a dungeon scene provider');
  }

  return context;
}

export function useResolvedDungeonScene() {
  return useDungeonSceneContext().descriptor;
}

export function useDungeonSceneDescriptor(descriptor: DungeonSceneDescriptor) {
  const { setDescriptor } = useDungeonSceneContext();

  useLayoutEffect(() => {
    setDescriptor(descriptor);

    return () => {
      setDescriptor(defaultDungeonSceneDescriptor);
    };
  }, [descriptor, setDescriptor]);
}

export function DungeonSceneScreen({
  descriptor,
  children,
  className,
}: {
  descriptor: DungeonSceneDescriptor;
  children: ReactNode;
  className?: string;
}) {
  useDungeonSceneDescriptor(descriptor);

  const containerClassName =
    descriptor.density === 'full'
      ? 'h-full'
      : descriptor.density === 'wide'
        ? 'mx-auto w-full max-w-6xl px-3 py-[calc(env(safe-area-inset-top)+4.3rem)] md:px-6 md:py-[calc(env(safe-area-inset-top)+4.65rem)]'
        : descriptor.density === 'centered'
          ? 'mx-auto flex min-h-full w-full max-w-3xl items-center justify-center px-3 py-[calc(env(safe-area-inset-top)+4.3rem)] md:px-6 md:py-[calc(env(safe-area-inset-top)+4.65rem)]'
          : 'mx-auto w-full max-w-5xl px-3 py-[calc(env(safe-area-inset-top)+4.3rem)] md:px-6 md:py-[calc(env(safe-area-inset-top)+4.65rem)]';

  return <div className={cn(containerClassName, className)}>{children}</div>;
}
