import type { ApiSuccess } from '@shared/contracts/http';
import type { CultivatorGameSettings } from '@shared/types/gameSettings';

export type PlayerSettingsResponse = ApiSuccess<CultivatorGameSettings>;

export interface UpdatePlayerSettingsRequest {
  gameSettings: CultivatorGameSettings;
}
