import CraftPage from '../craft/index';
import './index.css';

export default function AlchemyPage() {
  return (
    <CraftPage
      craftType="alchemy"
      title="炼丹房"
      eyebrow="丹炉"
      promptLabel="注入丹意"
      promptPlaceholder="比如：想炼一枚兼顾疗伤与回元、但药性不要太躁烈的丹"
    />
  );
}
