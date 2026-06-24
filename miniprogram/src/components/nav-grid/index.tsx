import { View, Text, Image } from '@tarojs/components';
import './index.css';

export interface NavItem {
  icon?: string;
  label: string;
  badge?: boolean;
  onClick?: () => void;
}

interface NavGridProps {
  items: NavItem[];
  columns?: number;
}

export default function NavGrid({ items, columns = 3 }: NavGridProps) {
  return (
    <View className='nav-grid' style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item, i) => (
        <View key={i} className='nav-item' onClick={item.onClick}>
          <View className='nav-icon-wrap'>
            {item.icon ? (
              <Image src={item.icon} className='nav-grid-icon' />
            ) : (
              <Text className='nav-icon-text'>{item.label.charAt(0)}</Text>
            )}
            {item.badge && <View className='badge-dot' />}
          </View>
          <Text className='nav-label'>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
