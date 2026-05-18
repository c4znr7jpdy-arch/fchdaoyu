import { cn } from '@shared/lib/cn';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface GameSceneTabItem {
  label: ReactNode;
  value: string;
}

export interface GameSceneTabsProps {
  items: GameSceneTabItem[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GameSceneTabs({
  items,
  activeValue,
  onChange,
  className,
}: GameSceneTabsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHint = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const maxLeft = element.scrollWidth - element.clientWidth;
    setCanScrollLeft(element.scrollLeft > 2);
    setCanScrollRight(maxLeft - element.scrollLeft > 2);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    updateScrollHint();
    element.addEventListener('scroll', updateScrollHint, { passive: true });
    window.addEventListener('resize', updateScrollHint);

    const observer = new ResizeObserver(() => updateScrollHint());
    observer.observe(element);

    return () => {
      element.removeEventListener('scroll', updateScrollHint);
      window.removeEventListener('resize', updateScrollHint);
      observer.disconnect();
    };
  }, [items, updateScrollHint]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const element = scrollRef.current;
    if (!element) return;

    const offset = Math.max(120, Math.floor(element.clientWidth * 0.45));
    element.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    });
  };

  return (
    <div className={cn('relative', className)}>
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="text-ink-secondary absolute top-1/2 left-0 z-10 flex -translate-y-1/2 items-center bg-[linear-gradient(90deg,rgba(248,243,230,0.98),rgba(248,243,230,0.5),transparent)] pr-4 pl-1 text-base"
          aria-label="查看左侧标签"
        >
          ←
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="text-ink-secondary absolute top-1/2 right-0 z-10 flex -translate-y-1/2 items-center bg-[linear-gradient(270deg,rgba(248,243,230,0.98),rgba(248,243,230,0.5),transparent)] pl-4 pr-1 text-base"
          aria-label="查看右侧标签"
        >
          →
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-4 overflow-x-auto whitespace-nowrap"
      >
        {items.map((item) => {
          const isActive = activeValue === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 border-b-2 px-1 pb-2 text-base transition-colors',
                isActive
                  ? 'border-crimson text-crimson font-semibold'
                  : 'border-transparent text-ink-secondary hover:text-ink',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
