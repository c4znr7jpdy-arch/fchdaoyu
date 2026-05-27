import { towerService } from '@server/lib/tower/service';
import { requireActiveCultivator } from '@server/lib/hono/middleware';
import type { AppEnv } from '@server/lib/hono/types';
import { REALM_VALUES } from '@shared/types/constants';
import { Hono } from 'hono';
import { z } from 'zod';

const router = new Hono<AppEnv>();
const battleRouter = new Hono<AppEnv>();

const BlessingSchema = z.object({
  blessingId: z.enum([
    'vitality_surge',
    'spirit_surge',
    'swift_step',
    'mind_focus',
    'jade_bones',
    'sea_of_qi',
    'breathing_technique',
    'meridian_cycle',
    'balanced_dao',
  ]),
});

const BattleIdBodySchema = z.object({
  battleId: z.string().min(1),
});

const LeaderboardQuerySchema = z.object({
  realm: z.enum(REALM_VALUES),
  limit: z.coerce.number().int().min(1).max(30).default(30),
});

router.post('/start', requireActiveCultivator(), async (c) => {
  const cultivator = c.get('cultivator');
  if (!cultivator) {
    return c.json({ error: '当前没有活跃角色' }, 404);
  }

  const result = await towerService.startRun(cultivator.id);
  return c.json(result);
});

router.get('/state', requireActiveCultivator(), async (c) => {
  const cultivator = c.get('cultivator');
  if (!cultivator) {
    return c.json({ error: '当前没有活跃角色' }, 404);
  }

  const result = await towerService.getState(cultivator.id);
  return c.json(result);
});

router.post('/reset', requireActiveCultivator(), async (c) => {
  const cultivator = c.get('cultivator');
  if (!cultivator) {
    return c.json({ error: '当前没有活跃角色' }, 404);
  }

  const result = await towerService.resetRun(cultivator.id);
  return c.json(result);
});

router.post('/blessing/choose', requireActiveCultivator(), async (c) => {
  try {
    const cultivator = c.get('cultivator');
    if (!cultivator) {
      return c.json({ error: '当前没有活跃角色' }, 404);
    }

    const { blessingId } = BlessingSchema.parse(await c.req.json());
    const result = await towerService.chooseBlessing(cultivator.id, blessingId);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '选择祝福失败';
    return c.json({ error: message }, 400);
  }
});

router.get('/leaderboard', requireActiveCultivator(), async (c) => {
  try {
    const cultivator = c.get('cultivator');
    const query = LeaderboardQuerySchema.parse({
      realm: c.req.query('realm'),
      limit: c.req.query('limit'),
    });
    const result = await towerService.getLeaderboard(
      cultivator?.id,
      query.realm,
      query.limit,
    );
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取塔榜失败';
    return c.json({ error: message }, 400);
  }
});

battleRouter.post('/probe', requireActiveCultivator(), async (c) => {
  try {
    const cultivator = c.get('cultivator');
    if (!cultivator) {
      return c.json({ error: '当前没有活跃角色' }, 404);
    }

    const result = await towerService.probeBattle(cultivator.id);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '照见幻影失败';
    return c.json({ error: message }, 400);
  }
});

battleRouter.post('/execute/v5', requireActiveCultivator(), async (c) => {
  try {
    const cultivator = c.get('cultivator');
    if (!cultivator) {
      return c.json({ error: '当前没有活跃角色' }, 404);
    }

    const { battleId } = BattleIdBodySchema.parse(await c.req.json());
    const result = await towerService.executeBattle(cultivator.id, battleId);
    return c.json({
      battleResult: result.battleResult,
      callbackData: {
        towerState: result.state,
        isFinished: result.isFinished,
        settlement: result.settlement,
        milestoneReward: result.milestoneReward,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '幻境战局执行失败';
    return c.json({ error: message }, 400);
  }
});

router.route('/battle', battleRouter);

export default router;
