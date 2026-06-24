import { View, Text } from '@tarojs/components';
import './index.css';

interface ProgressBarProps {
  label: string;
  percent: number;
}

export default function ProgressBar({ label, percent }: ProgressBarProps) {
  return (
    <View className='progress-wrap'>
      <Text className='progress-label'>{label}</Text>
      <View className='progress-bar'>
        <View className='progress-fill' style={{ width: `${Math.min(percent, 100)}%` }} />
      </View>
      <Text className='progress-val'>{percent}%</Text>
    </View>
  );
}
