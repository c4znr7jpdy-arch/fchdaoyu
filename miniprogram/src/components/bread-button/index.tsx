import { View, Text } from '@tarojs/components';
import './index.css';

interface BreadButtonProps {
  variant?: 'primary' | 'ghost';
  children: string;
  onClick?: () => void;
}

export default function BreadButton({ variant = 'primary', children, onClick }: BreadButtonProps) {
  return (
    <View className={`bread-btn bread-btn--${variant}`} onClick={onClick}>
      <Text className='bread-btn-text'>{children}</Text>
    </View>
  );
}
