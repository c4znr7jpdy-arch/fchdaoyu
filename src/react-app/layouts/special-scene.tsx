import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type SpecialBackOverride = {
  label?: string;
  onBack: () => void;
};

interface SpecialSceneContextValue {
  backOverride: SpecialBackOverride | null;
  setBackOverride: (next: SpecialBackOverride | null) => void;
}

const SpecialSceneContext = createContext<SpecialSceneContextValue | null>(null);

export function SpecialSceneProvider({ children }: { children: ReactNode }) {
  const [backOverride, setBackOverride] = useState<SpecialBackOverride | null>(
    null,
  );
  const value = useMemo(
    () => ({
      backOverride,
      setBackOverride,
    }),
    [backOverride],
  );

  return (
    <SpecialSceneContext.Provider value={value}>
      {children}
    </SpecialSceneContext.Provider>
  );
}

function useSpecialSceneContext() {
  const context = useContext(SpecialSceneContext);

  if (!context) {
    throw new Error('special scene hooks must be used within a special scene layout');
  }

  return context;
}

export function useSpecialSceneBackOverride() {
  return useSpecialSceneContext().backOverride;
}

export function useSpecialSceneBackAction(
  backOverride: SpecialBackOverride | null,
) {
  const { setBackOverride } = useSpecialSceneContext();
  const label = backOverride?.label;
  const onBack = backOverride?.onBack;

  useEffect(() => {
    setBackOverride(onBack ? { label, onBack } : null);

    return () => {
      setBackOverride(null);
    };
  }, [label, onBack, setBackOverride]);
}
