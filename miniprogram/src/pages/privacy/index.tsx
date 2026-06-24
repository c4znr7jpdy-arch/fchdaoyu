import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import InkDivider from '@/components/ink-divider';
import './index.css';

export default function Privacy() {
  return (
    <View className="page">
      <View className="doc-header">
        <Text className="doc-title">隐私协议</Text>
        <Text className="doc-date">生效日期：2026 年 6 月 24 日</Text>
      </View>

      <InkDivider />

      <View className="doc-section">
        <Text className="section-heading">一、引言</Text>
        <Text className="section-body">
          欢迎使用「万界道友」（以下简称"本应用"）。本隐私协议旨在向你说明我们如何收集、使用、存储和保护你的个人信息。请在使用本应用前仔细阅读本协议。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">二、信息收集</Text>
        <Text className="section-body">为提供修仙模拟服务，我们可能收集以下信息：</Text>
        <Text className="section-body">
          1. 微信 OpenID：用于识别你的微信用户身份，实现登录和数据关联。OpenID 通过微信登录接口获取，不会用于其他用途。
        </Text>
        <Text className="section-body">
          2. 游戏数据：包括角色信息、修仙进度、道具背包、交易记录等，用于维持你的游戏状态。
        </Text>
        <Text className="section-body">
          3. 聊天内容：世界聊天中的消息内容，用于内容安全审核和社区管理。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">三、信息使用</Text>
        <Text className="section-body">我们收集的信息仅用于：</Text>
        <Text className="section-body">1. 提供和维护游戏核心功能。</Text>
        <Text className="section-body">2. 保障账号安全和服务稳定性。</Text>
        <Text className="section-body">3. 进行必要的内容安全审核。</Text>
        <Text className="section-body">4. 改善和优化用户体验。</Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">四、信息存储与安全</Text>
        <Text className="section-body">
          你的游戏数据存储在我们自有服务器上。我们采取合理的技术和管理措施保护你的信息安全，防止数据丢失、未经授权的访问或泄露。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">五、信息共享</Text>
        <Text className="section-body">
          除法律法规要求或经你明确同意外，我们不会将你的个人信息共享给第三方。在游戏排行榜等公开场景中，你的角色名称和修仙数据会向其他玩家展示。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">六、未成年人保护</Text>
        <Text className="section-body">
          本应用面向所有年龄用户。如果你是未满 18 周岁的未成年人，请在监护人指导下使用本应用。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">七、协议更新</Text>
        <Text className="section-body">
          我们可能会不时更新本隐私协议。更新后的协议将在本页面发布，重大变更时我们会通过应用内通知告知你。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">八、联系我们</Text>
        <Text className="section-body">
          如你对本隐私协议有任何疑问，请通过应用内反馈渠道联系我们。
        </Text>
      </View>

      <View className="doc-footer">
        <Text className="footer-text">「万界道友」运营团队</Text>
      </View>
    </View>
  );
}
