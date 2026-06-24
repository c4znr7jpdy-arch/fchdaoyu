import { View, Text } from '@tarojs/components';
import './index.css';

export interface TabItem {
  key: string;
  label: string;
}

interface TabBarProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function TabBar({ items, active, onChange, className }: TabBarProps) {
  return (
    <View className={className ? `tabs ${className}` : 'tabs'}>
      {items.map((item) => (
        <View
          key={item.key}
          className={`tab ${item.key === active ? 'tab--active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          <Text className='tab-text'>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
