import { View, Text } from '@tarojs/components';
import './index.css';

interface RoleCardProps {
  name: string;
  subtitle: string;
  level?: string;
  avatar?: string;
}

export default function RoleCard({ name, subtitle, level, avatar }: RoleCardProps) {
  return (
    <View className='role-card'>
      <View className='role-avatar'>
        <Text className='role-avatar-text'>{avatar || name[0]}</Text>
      </View>
      <View className='role-info'>
        <Text className='role-name'>{name}</Text>
        <Text className='role-desc'>{subtitle}</Text>
      </View>
      {level && (
        <View className='role-level'>
          <Text className='role-level-text'>{level}</Text>
        </View>
      )}
    </View>
  );
}
