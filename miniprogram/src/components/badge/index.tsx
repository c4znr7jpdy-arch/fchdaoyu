import { View, Text } from '@tarojs/components';
import './index.css';

interface BadgeProps {
  count?: number;
}

export default function Badge({ count }: BadgeProps) {
  if (count && count > 0) {
    return (
      <View className='badge-count'>
        <Text className='badge-count-text'>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  }
  return <View className='badge-dot' />;
}
