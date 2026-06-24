import CraftPage from '../craft/index';
import './index.css';

export default function RefinePage() {
  return (
    <CraftPage
      craftType="create_artifact"
      title="炼器阁"
      eyebrow="锻造"
      promptLabel="注入炼器意图"
      promptPlaceholder="比如：想炼一柄锋锐的火属性长剑"
    />
  );
}
