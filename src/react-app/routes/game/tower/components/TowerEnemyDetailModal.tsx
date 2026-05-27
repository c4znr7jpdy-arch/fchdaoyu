import { LingGenMini } from '@app/components/func/LingGen';
import { InkBadge } from '@app/components/ui/InkBadge';
import { ItemShowcaseModal } from '@app/components/ui/ItemShowcaseModal';
import type { TowerBattleContext } from '@shared/lib/tower';
import { describeEncounterLabel } from '../utils';

interface TowerEnemyDetailModalProps {
  context: TowerBattleContext | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TowerEnemyDetailModal({
  context,
  isOpen,
  onClose,
}: TowerEnemyDetailModalProps) {
  if (!context) {
    return null;
  }

  const { enemy, encounter } = context;

  return (
    <ItemShowcaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon="👁️"
      name={enemy.name}
      badges={[
        <InkBadge key="realm" tier={encounter.realm}>
          {`${encounter.realm} ${encounter.realmStage}`}
        </InkBadge>,
        <InkBadge key="kind" tone="accent">
          {describeEncounterLabel(encounter.kind)}
        </InkBadge>,
      ]}
      summary={
        <div className="space-y-2 text-center">
          {enemy.title ? (
            <p className="text-ink-secondary text-sm leading-7">「{enemy.title}」</p>
          ) : null}
          {enemy.description ? (
            <p className="text-sm leading-7">{enemy.description}</p>
          ) : null}
        </div>
      }
      metaSection={
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>体魄：{enemy.attributes.vitality}</div>
            <div>灵力：{enemy.attributes.spirit}</div>
            <div>悟性：{enemy.attributes.wisdom}</div>
            <div>身法：{enemy.attributes.speed}</div>
            <div className="col-span-2">神识：{enemy.attributes.willpower}</div>
          </div>
          <LingGenMini spiritualRoots={enemy.spiritual_roots} />
          {enemy.skills.length > 0 ? (
            <div className="space-y-1">
              <div className="font-semibold">所携神通</div>
              <div className="space-y-1 text-sm leading-7">
                {enemy.skills.map((skill, index) => (
                  <div key={`${skill.name}-${index}`}>
                    {skill.name}
                    {skill.description ? ` · ${skill.description}` : ''}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      }
      description={enemy.background}
      descriptionTitle="来历"
    />
  );
}
