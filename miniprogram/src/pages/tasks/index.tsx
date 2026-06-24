import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getTasks, claimTaskReward } from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import type { TaskInstance } from '@shared/types/task';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import BreadButton from '@/components/bread-button';
import ScrollCard from '@/components/scroll-card';
import './index.css';

const TASK_TITLE: Record<string, string> = {
  tutorial_starter_supply: '入门供给',
  tutorial_first_alchemy: '第一炉疗伤丹',
  tutorial_first_dungeon: '第一次低危探秘',
  daily_alchemy_once: '丹炉留痕',
  daily_dungeon_once: '云游一程',
  daily_ranking_once: '试手天骄',
  daily_arena_once: '切磋一场',
  daily_market_once: '坊市逛逛',
  daily_retreat_once: '静室修行',
};

const CATEGORY_LABEL: Record<string, string> = {
  tutorial: '新手',
  daily: '日常',
  breakthrough_major: '破境',
};

function getTaskTitle(task: TaskInstance): string {
  if (TASK_TITLE[task.definitionId]) return TASK_TITLE[task.definitionId];
  const cat = CATEGORY_LABEL[task.category] ?? task.category;
  const raw = task.definitionId.replace(/^[a-z_]+_/, '');
  return `${cat} · ${raw}`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getTasks();
      if (result.success && result.data) {
        setTasks(result.data.tasks ?? []);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleClaim = async (taskId: string) => {
    try {
      const result = await claimTaskReward(taskId);
      if (result.success) {
        Taro.showToast({ title: '领取成功', icon: 'success' });
        loadTasks();
      } else {
        Taro.showToast({ title: result.error || '领取失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({ title: '领取失败', icon: 'none' });
    }
  };

  if (loading) {
    return (
      <View className="page">
        <ScrollCard>
          <Text className="cardTitle">任务中心</Text>
          <Text className="cardBody">正在探查天命...</Text>
        </ScrollCard>
      </View>
    );
  }

  const activeTasks = tasks.filter((t) => t.status === 'active');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">任务中心</Text>
        <Text className="title">天命</Text>
      </View>

      {error && (
        <ScrollCard>
          <Text className="cardBody">{error}</Text>
        </ScrollCard>
      )}

      {activeTasks.length === 0 && completedTasks.length === 0 && !error && (
        <ScrollCard>
          <Text className="cardBody">暂无任务</Text>
        </ScrollCard>
      )}

      {activeTasks.length > 0 && (
        <>
          <InkDivider />
          <SectionTitle>进行中</SectionTitle>
          <ScrollCard>
            {activeTasks.map((task) => (
              <View key={task.id} className="task-card">
                <Text className="task-name">{getTaskTitle(task)}</Text>
                <Text className="task-category">{CATEGORY_LABEL[task.category] ?? task.category}</Text>
                {task.metadata?.rewardSummary && task.metadata.rewardSummary.length > 0 && (
                  <Text className="task-reward">{task.metadata.rewardSummary.join(' · ')}</Text>
                )}
              </View>
            ))}
          </ScrollCard>
        </>
      )}

      {completedTasks.length > 0 && (
        <>
          <InkDivider />
          <SectionTitle>已完成</SectionTitle>
          <ScrollCard>
            {completedTasks.map((task) => (
              <View key={task.id} className="task-card">
                <Text className="task-name">{getTaskTitle(task)}</Text>
                {task.metadata?.rewardSummary && task.metadata.rewardSummary.length > 0 && (
                  <Text className="task-reward">{task.metadata.rewardSummary.join(' · ')}</Text>
                )}
                <BreadButton onClick={() => handleClaim(task.id)}>
                  领取奖励
                </BreadButton>
              </View>
            ))}
          </ScrollCard>
        </>
      )}
    </View>
  );
}
