import { View, Text } from '@tarojs/components';
import './index.css';

interface TagProps {
  variant?: 'default' | 'win' | 'lose' | 'equipped';
  children: string;
}

export default function Tag({ variant = 'default', children }: TagProps) {
  return (
    <View className={`tag tag--${variant}`}>
      <Text className='tag-text'>{children}</Text>
    </View>
  );
}
