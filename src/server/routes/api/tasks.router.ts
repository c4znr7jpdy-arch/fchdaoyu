import { requireActiveCultivator } from '@server/lib/hono/middleware';
import type { AppEnv } from '@server/lib/hono/types';
import { TaskService } from '@server/lib/services/TaskService';
import { Hono } from 'hono';
import { z } from 'zod';

const ListQuerySchema = z.object({
  status: z.enum(['active', 'completed']).optional(),
});

const router = new Hono<AppEnv>();

router.get('/', requireActiveCultivator(), async (c) => {
  const cultivator = c.get('cultivator');
  if (!cultivator) {
    return c.json({ error: '当前没有活跃角色' }, 404);
  }

  try {
    const { status } = ListQuerySchema.parse(c.req.query());
    const tasks = await TaskService.listCultivatorTasks(cultivator.id, status);
    return c.json({
      success: true,
      data: {
        tasks,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues[0]?.message || '查询参数错误' }, 400);
    }
    console.error('获取任务列表失败:', error);
    return c.json({ error: '获取任务列表失败，请稍后再试' }, 500);
  }
});

router.get('/:id', requireActiveCultivator(), async (c) => {
  const cultivator = c.get('cultivator');
  if (!cultivator) {
    return c.json({ error: '当前没有活跃角色' }, 404);
  }

  try {
    const task = await TaskService.getCultivatorTask(
      cultivator.id,
      c.req.param('id'),
    );
    if (!task) {
      return c.json({ error: '任务不存在' }, 404);
    }

    return c.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    return c.json({ error: '获取任务详情失败，请稍后再试' }, 500);
  }
});

router.post('/:id/challenge', requireActiveCultivator(), async (c) => {
  const cultivator = c.get('cultivator');
  if (!cultivator) {
    return c.json({ error: '当前没有活跃角色' }, 404);
  }

  try {
    const result = await TaskService.runTaskChallenge(
      cultivator.id,
      c.req.param('id'),
    );

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '试炼失败，请稍后再试';
    const status =
      message === '任务不存在'
        ? 404
        : message.includes('没有可执行')
          ? 409
          : 400;
    return c.json({ error: message }, status);
  }
});

export default router;
