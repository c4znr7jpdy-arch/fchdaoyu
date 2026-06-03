import { InkButton } from '@app/components/ui/InkButton';
import { usePlayer } from '@app/lib/player/usePlayer';
import { useState } from 'react';
import { SettingsField } from './SettingsFields';
import { formatDateTime } from './utils';

export function GameSettingsTab() {
  const { cultivator } = usePlayer();
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const cultivatorId = cultivator?.id ?? '';

  const handleCopyCultivatorId = async () => {
    if (!cultivatorId) return;

    try {
      await navigator.clipboard.writeText(cultivatorId);
      setCopyMessage('已复制');
    } catch {
      setCopyMessage('复制失败');
    }
  };

  return (
    <div>
      <SettingsField
        label="角色 ID"
        value={cultivatorId || '—'}
        mono
        action={
          cultivatorId ? (
            <InkButton variant="secondary" onClick={handleCopyCultivatorId}>
              复制
            </InkButton>
          ) : null
        }
      />
      <SettingsField
        label="角色创建时间"
        value={formatDateTime(cultivator?.createdAt)}
      />
      {copyMessage ? (
        <p className="text-ink-secondary mt-3 text-sm">{copyMessage}</p>
      ) : null}
    </div>
  );
}
