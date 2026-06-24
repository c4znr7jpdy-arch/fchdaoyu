import { View, Text } from '@tarojs/components';
import InkDivider from '@/components/ink-divider';
import './index.css';

export default function Agreement() {
  return (
    <View className="page">
      <View className="doc-header">
        <Text className="doc-title">用户协议</Text>
        <Text className="doc-date">生效日期：2026 年 6 月 24 日</Text>
      </View>

      <InkDivider />

      <View className="doc-section">
        <Text className="section-heading">一、服务条款</Text>
        <Text className="section-body">
          欢迎使用「万界道友」。本应用是一款修仙模拟类微信小程序，由独立开发者运营。使用本应用即表示你同意遵守本用户协议。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">二、账号注册</Text>
        <Text className="section-body">
          1. 本应用通过微信登录方式注册账号，无需额外填写个人信息。
        </Text>
        <Text className="section-body">
          2. 你应妥善保管自己的微信账号，因账号保管不当导致的损失由你自行承担。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">三、用户行为规范</Text>
        <Text className="section-body">使用本应用时，你同意：</Text>
        <Text className="section-body">1. 不使用任何外挂、脚本或其他非正常手段获取游戏资源。</Text>
        <Text className="section-body">2. 不发布违法违规、色情暴力、诈骗、人身攻击等内容。</Text>
        <Text className="section-body">3. 不恶意利用系统漏洞或进行扰乱游戏秩序的行为。</Text>
        <Text className="section-body">4. 尊重其他玩家，维护良好的社区环境。</Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">四、虚拟物品</Text>
        <Text className="section-body">
          1. 游戏内的灵石、道具、丹药等虚拟物品仅限在游戏内使用，不具有现实货币价值。
        </Text>
        <Text className="section-body">
          2. 我们保留对虚拟物品进行调整、回收或重置的权利，但会尽量提前通知。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">五、免责声明</Text>
        <Text className="section-body">
          1. 因网络状况、设备兼容性等原因导致的服务中断，我们不承担责任，但会尽力恢复。
        </Text>
        <Text className="section-body">
          2. 因不可抗力导致的数据丢失，我们不承担责任。
        </Text>
      </View>

      <View className="doc-section">
        <Text className="section-heading">六、协议修改</Text>
        <Text className="section-body">
          我们保留修改本协议的权利。修改后的协议将在本页面发布，继续使用本应用即表示你接受修改后的协议。
        </Text>
      </View>

      <View className="doc-footer">
        <Text className="footer-text">「万界道友」运营团队</Text>
      </View>
    </View>
  );
}
