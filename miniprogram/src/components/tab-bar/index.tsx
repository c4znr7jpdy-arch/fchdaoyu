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
}

export default function TabBar({ items, active, onChange }: TabBarProps) {
  return (
    <View className='tabs'>
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
