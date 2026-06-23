import { request } from '@/lib/client';
import type { PlayerActiveResponse } from '@shared/contracts/player';
import type { CharacterGenerationQuotaResponse, GenerateCharacterResponse } from '@shared/contracts/character-generation';
import type { TaskListResponse } from '@shared/contracts/task';

// ===== Player =====
export function getPlayerActive() {
  return request<PlayerActiveResponse>({ url: '/api/player/active' });
}

// ===== Character Generation =====
export function getGenerationQuota() {
  return request<CharacterGenerationQuotaResponse>({ url: '/api/generate-character/quota' });
}

export function generateCharacter(userInput: string) {
  return request<GenerateCharacterResponse>({
    url: '/api/generate-character',
    method: 'POST',
    data: { userInput },
  });
}

export function generateFates(tempId: string) {
  return request<{ success: boolean; data?: { fates: unknown[]; remainingRerolls: number }; error?: string }>({
    url: '/api/generate-fates',
    method: 'POST',
    data: { tempId },
  });
}

export function saveCharacter(tempCultivatorId: string, selectedFateIndices: number[]) {
  return request<{ success: boolean; data?: unknown; error?: string }>({
    url: '/api/save-character',
    method: 'POST',
    data: { tempCultivatorId, selectedFateIndices },
  });
}

// ===== Tasks =====
export function getTasks() {
  return request<TaskListResponse>({ url: '/api/tasks' });
}

export function claimTaskReward(taskId: string) {
  return request<{ success: boolean; data?: unknown; error?: string }>({
    url: `/api/tasks/${taskId}/claim-reward`,
    method: 'POST',
  });
}
