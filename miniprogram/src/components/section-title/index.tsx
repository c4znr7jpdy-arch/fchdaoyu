import { View, Text } from '@tarojs/components';
import './index.css';

interface SectionTitleProps {
  children: string;
}

export default function SectionTitle({ children }: SectionTitleProps) {
  return (
    <View className='section-title'>
      <Text className='section-title-text'>{children}</Text>
    </View>
  );
}
