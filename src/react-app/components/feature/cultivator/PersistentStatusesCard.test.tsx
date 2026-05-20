import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CultivatorCurrentStatusSection,
  CultivatorTrackSection,
} from './PersistentStatusesCard';

const mockUseCultivator = vi.fn();
const mockIsConditionStatusActive = vi.fn();
const mockGetPillToxicityStage = vi.fn();
const mockGetConditionStatusTemplate = vi.fn();
const mockGetAllTrackConfigs = vi.fn();

vi.mock('@app/lib/contexts/CultivatorContext', () => ({
  useCultivator: () => mockUseCultivator(),
}));

vi.mock('@shared/lib/condition', () => ({
  isConditionStatusActive: (...args: unknown[]) =>
    mockIsConditionStatusActive(...args),
  getPillToxicityStage: (...args: unknown[]) => mockGetPillToxicityStage(...args),
}));

vi.mock('@shared/lib/conditionStatusRegistry', () => ({
  getConditionStatusTemplate: (...args: unknown[]) =>
    mockGetConditionStatusTemplate(...args),
}));

vi.mock('@shared/lib/trackConfigRegistry', () => ({
  getAllTrackConfigs: () => mockGetAllTrackConfigs(),
}));

describe('PersistentStatusesCard sections', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-19T12:00:00.000Z'));

    mockIsConditionStatusActive.mockReturnValue(true);
    mockGetPillToxicityStage.mockReturnValue({ key: 'alert', label: '毒息未散' });
    mockGetConditionStatusTemplate.mockReturnValue({
      name: '福缘护体',
      description: '护住经脉',
      display: {
        icon: '✨',
        shortDesc: '经脉受护',
      },
    });
    mockGetAllTrackConfigs.mockReturnValue([
      {
        key: 'tempering.vitality',
        name: '炼体·体魄',
        shortDesc: '升级后永久提升体魄',
        thresholdByLevel: (level: number) => 100 * (level + 1),
      },
      {
        key: 'marrow_wash',
        name: '洗髓',
        shortDesc: '升级后所有灵根各提升 1 点',
        thresholdByLevel: (level: number) => 100 * (level + 1),
      },
    ]);

    mockUseCultivator.mockReturnValue({
      cultivator: {
        condition: {
          resources: {
            hp: { current: 80 },
            mp: { current: 40 },
          },
          gauges: {
            pillToxicity: 12,
          },
          statuses: [
            {
              key: 'blessing',
              duration: {
                kind: 'time',
                expiresAt: '2026-05-19T12:30:00.000Z',
              },
              usesRemaining: 2,
            },
          ],
          tracks: {
            marrowWash: {
              level: 2,
              progress: 40,
            },
            tempering: {
              vitality: {
                level: 1,
                progress: 20,
              },
              spirit: {
                level: 0,
                progress: 0,
              },
              wisdom: {
                level: 0,
                progress: 0,
              },
              speed: {
                level: 0,
                progress: 0,
              },
              willpower: {
                level: 0,
                progress: 0,
              },
            },
          },
        },
      },
      finalAttributes: {
        maxHp: 120,
        maxMp: 60,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders compact current-status content and a separate compact track section', () => {
    const html = renderToStaticMarkup(
      <>
        <CultivatorCurrentStatusSection />
        <CultivatorTrackSection />
      </>,
    );

    expect(html).toContain('当前状态');
    expect(html).toContain('气血');
    expect(html).toContain('80 / 120');
    expect(html).toContain('真元');
    expect(html).toContain('40 / 60');
    expect(html).toContain('丹毒');
    expect(html).toContain('12');
    expect(html).toContain('毒息未散');
    expect(html).toContain('福缘护体');
    expect(html).toContain('30分');
    expect(html).toContain('2次');

    expect(html).toContain('洗髓与炼体');
    expect(html).toContain('洗髓');
    expect(html).toContain('Lv.2');
    expect(html).toContain('40 / 300');
    expect(html.indexOf('洗髓')).toBeLessThan(html.indexOf('炼体·体魄'));
    expect(html).toContain('炼体·体魄');
    expect(html).toContain('Lv.1');
    expect(html).toContain('20 / 200');

    expect(html).not.toContain('升级后永久提升体魄');
    expect(html).not.toContain('升级后所有灵根各提升 1 点');
  });

  it('keeps marrow wash visible even before other tracks have progressed', () => {
    mockUseCultivator.mockReturnValue({
      cultivator: {
        condition: {
          resources: {
            hp: { current: 120 },
            mp: { current: 60 },
          },
          gauges: {
            pillToxicity: 0,
          },
          statuses: [],
          tracks: {
            marrowWash: {
              level: 0,
              progress: 0,
            },
            tempering: {
              vitality: {
                level: 0,
                progress: 0,
              },
              spirit: {
                level: 0,
                progress: 0,
              },
              wisdom: {
                level: 0,
                progress: 0,
              },
              speed: {
                level: 0,
                progress: 0,
              },
              willpower: {
                level: 0,
                progress: 0,
              },
            },
          },
        },
      },
      finalAttributes: {
        maxHp: 120,
        maxMp: 60,
      },
    });

    const html = renderToStaticMarkup(<CultivatorTrackSection />);

    expect(html).toContain('洗髓与炼体');
    expect(html).toContain('洗髓');
    expect(html).toContain('Lv.0');
    expect(html).toContain('0 / 100');
    expect(html).not.toContain('炼体·体魄');
  });
});
