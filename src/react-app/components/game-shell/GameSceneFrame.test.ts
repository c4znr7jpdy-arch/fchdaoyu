import { describe, expect, it } from 'vitest';
import { resolveGameSceneFrameHeader } from './gameSceneFrameHeader';

describe('resolveGameSceneFrameHeader', () => {
  it('uses the route scene label and hides context when title matches it', () => {
    const header = resolveGameSceneFrameHeader({
      sceneLabel: '储物袋',
      sceneSummary: '点清身边诸物，再决定去留流转。',
      title: '【储物袋】',
      description: '不会取这里',
    });

    expect(header).toEqual({
      label: '储物袋',
      contextLabel: null,
      summary: '点清身边诸物，再决定去留流转。',
    });
  });

  it('keeps the route scene label and exposes a smaller context label when title differs', () => {
    const header = resolveGameSceneFrameHeader({
      sceneLabel: '坊市',
      sceneSummary: '买卖流转与鉴宝收材皆由此起。',
      title: '【云游坊市】',
      description: '不会取这里',
    });

    expect(header).toEqual({
      label: '坊市',
      contextLabel: '云游坊市',
      summary: '买卖流转与鉴宝收材皆由此起。',
    });
  });

  it('falls back to the title and description when no scene handle is present', () => {
    const header = resolveGameSceneFrameHeader({
      sceneLabel: null,
      sceneSummary: null,
      title: '【世界传音】',
      description: '诸界消息在此汇聚。',
    });

    expect(header).toEqual({
      label: '世界传音',
      contextLabel: null,
      summary: '诸界消息在此汇聚。',
    });
  });
});
