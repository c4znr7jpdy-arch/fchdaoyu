import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getTasks, claimTaskReward } from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import type { TaskInstance } from '@shared/types/task';
import './index.css';

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
        <View className="card status checking">
          <Text className="cardTitle">任务中心</Text>
          <Text className="cardBody">正在探查天命...</Text>
        </View>
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
        <View className="card status error">
          <Text className="cardBody">{error}</Text>
        </View>
      )}

      {activeTasks.length === 0 && completedTasks.length === 0 && !error && (
        <View className="card muted">
          <Text className="cardBody">暂无任务</Text>
        </View>
      )}

      {activeTasks.length > 0 && (
        <View className="card">
          <Text className="cardTitle">进行中</Text>
          {activeTasks.map((task) => (
            <View key={task.id} className="task-card">
              <Text className="task-name">{task.definitionId}</Text>
              <Text className="task-category">{task.category}</Text>
            </View>
          ))}
        </View>
      )}

      {completedTasks.length > 0 && (
        <View className="card muted">
          <Text className="cardTitle">已完成</Text>
          {completedTasks.map((task) => (
            <View key={task.id} className="task-card">
              <Text className="task-name">{task.definitionId}</Text>
              <Button className="btn-small" onClick={() => handleClaim(task.id)}>
                领取奖励
              </Button>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
