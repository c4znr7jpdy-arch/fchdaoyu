import { View } from '@tarojs/components';
import './index.css';

interface ScrollCardProps {
  children: any;
}

export default function ScrollCard({ children }: ScrollCardProps) {
  return <View className='scroll-card'>{children}</View>;
}
