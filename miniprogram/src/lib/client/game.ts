import { request } from './request';
import Taro from '@tarojs/taro';
import { API_BASE_URL } from '@/config';
import { getSessionToken } from '@/lib/auth';
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

// ===== Inventory =====
export type InventoryTab = 'artifacts' | 'materials' | 'consumables';

export interface InventoryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface InventoryListResponse {
  success: boolean;
  data?: {
    items?: unknown[];
    pagination?: InventoryPagination;
  };
  error?: string;
}

export function fetchInventory(tab: InventoryTab, page = 1, pageSize = 20) {
  const query = `type=${tab}&page=${page}&pageSize=${pageSize}`;
  return request<InventoryListResponse>({
    url: `/api/cultivator/inventory?${query}`,
  });
}

export function equipArtifact(artifactId: string) {
  return request<{ success: boolean; data?: unknown; error?: string }>({
    url: '/api/cultivator/equip',
    method: 'POST',
    data: { artifactId },
  });
}

export function consumeItem(consumableId: string) {
  return request<{ success: boolean; data?: { message?: string }; error?: string }>({
    url: '/api/cultivator/consume',
    method: 'POST',
    data: { consumableId },
  });
}

export function identifyMaterial(materialId: string) {
  return request<{
    success: boolean;
    revealedItem?: { id?: string; name: string; quantity?: number; rank?: string };
    error?: string;
  }>({
    url: '/api/cultivator/inventory/identify',
    method: 'POST',
    data: { materialId },
  });
}

export function discardItem(itemId: string, itemType: 'artifact' | 'consumable' | 'material') {
  return request<{ success: boolean; data?: unknown; error?: string }>({
    url: '/api/cultivator/inventory/discard',
    method: 'POST',
    data: { itemId, itemType },
  });
}

// ===== Retreat =====
export type RetreatAction = 'cultivate' | 'breakthrough';

export interface RetreatResultData {
  summary: {
    success?: boolean;
    fromRealm?: string;
    fromStage?: string;
    toRealm?: string;
    toStage?: string;
    yearsSpent?: number;
    chance?: number;
    roll?: number;
    lifespanGained?: number;
    attributeGrowth?: unknown;
    expGained?: number;
    newExp?: number;
    expCap?: number;
    [key: string]: unknown;
  };
  action: RetreatAction;
  story?: string;
  storyType?: 'breakthrough' | 'lifespan' | null;
  depleted?: boolean;
}

export interface RetreatStreamResult {
  result: RetreatResultData | null;
  error?: string;
  httpStatus: number;
}

export async function performRetreat(
  action: RetreatAction,
  years?: number,
): Promise<RetreatStreamResult> {
  const token = getSessionToken();
  const response = await Taro.request<string>({
    url: `${API_BASE_URL}/api/cultivator/retreat`,
    method: 'POST',
    data: { action, years },
    timeout: 60000,
    responseType: 'text',
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    let errMsg = `请求失败：${response.statusCode}`;
    try {
      const errPayload =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;
      errMsg = errPayload?.error || errPayload?.message || errMsg;
    } catch {
      // ignore
    }
    return { result: null, error: errMsg, httpStatus: response.statusCode };
  }

  const body = typeof response.data === 'string' ? response.data : '';
  let result: RetreatResultData | null = null;
  let streamError: string | undefined;

  const segments = body.split('\n\n');
  for (const segment of segments) {
    const dataLines = segment
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6))
      .join('\n')
      .trim();
    if (!dataLines || dataLines === '[DONE]') continue;
    try {
      const event = JSON.parse(dataLines) as
        | { type: 'result'; data: RetreatResultData }
        | { type: 'chunk'; text: string }
        | { type: 'error'; error: string };
      if (event.type === 'result') {
        result = event.data;
      } else if (event.type === 'chunk' && result) {
        result = { ...result, story: `${result.story ?? ''}${event.text}` };
      } else if (event.type === 'error') {
        streamError = event.error;
      }
    } catch {
      // ignore malformed event
    }
  }

  return { result, error: streamError, httpStatus: response.statusCode };
}

// ===== Products (gongfa / skill / artifact) =====
export type ProductType = 'gongfa' | 'skill' | 'artifact';

export interface ProductRecord {
  id: string;
  name: string;
  description?: string;
  productType?: ProductType;
  quality?: string;
  element?: string;
  slot?: string;
  score?: number;
  isEquipped?: boolean;
  [key: string]: unknown;
}

export function fetchProducts(type: ProductType) {
  return request<{ success: boolean; data?: ProductRecord[]; error?: string }>({
    url: `/api/v2/products?type=${type}`,
  });
}

export function equipProduct(productId: string) {
  return request<{ success: boolean; equipped?: boolean; error?: string }>({
    url: '/api/v2/products/equip',
    method: 'POST',
    data: { productId },
  });
}

export function deleteProduct(productId: string) {
  return request<{ success: boolean; error?: string }>({
    url: `/api/v2/products/${productId}`,
    method: 'DELETE',
  });
}

// ===== Craft (alchemy / refine) =====
export type CraftType = 'alchemy' | 'create_artifact';

export interface CraftPreviewData {
  cost: { spiritStones: number };
  canAfford: boolean;
  validation: {
    valid: boolean;
    blockingReason?: string;
    warnings: string[];
  };
}

export interface CraftResultData {
  consumable?: {
    id?: string;
    name: string;
    type?: string;
    quality?: string;
    quantity?: number;
    description?: string;
  };
  artifact?: {
    id?: string;
    name: string;
    slot?: string;
    element?: string;
    quality?: string;
    description?: string;
  };
  formulaDiscovery?: unknown;
  formulaProgress?: unknown;
}

export function fetchCraftPreview(
  craftType: CraftType,
  materialIds: string[],
  alchemyMode: 'improvised' | 'formula' = 'improvised',
) {
  const params = new URLSearchParams({
    craftType,
    alchemyMode,
    materialIds: materialIds.join(','),
  });
  return request<{ success: boolean; data?: CraftPreviewData; error?: string }>({
    url: `/api/craft?${params.toString()}`,
  });
}

export function submitCraft(payload: {
  craftType: CraftType;
  materialIds: string[];
  materialQuantities: Record<string, number>;
  userPrompt?: string;
  alchemyMode?: 'improvised' | 'formula';
}) {
  return request<{ success: boolean; data?: CraftResultData; error?: string }>({
    url: '/api/craft',
    method: 'POST',
    data: payload,
  });
}

// ===== Battle Records =====
export type BattleRecordType = 'challenge' | 'challenged';

export interface BattleRecordV2Summary {
  id: string;
  createdAt: string | null;
  battleType: BattleRecordType;
  opponentCultivatorId: string | null;
  winner: { id: string; name: string; realm: string; realm_stage: string };
  loser: { id: string; name: string; realm: string; realm_stage: string };
  turns: number;
}

export interface BattleRecordV2Detail {
  id: string;
  createdAt: string | null;
  battleResult: {
    winner: { id: string; name: string; realm: string; realm_stage: string };
    loser: { id: string; name: string; realm: string; realm_stage: string };
    logs: string[];
    turns: number;
    player: string;
    opponent: string;
  };
  battleReport?: string | null;
}

export function fetchBattleRecords(
  page = 1,
  pageSize = 20,
  type?: BattleRecordType,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (type) params.set('type', type);
  return request<{
    success: boolean;
    data?: BattleRecordV2Summary[];
    pagination?: { page: number; pageSize: number; total: number; totalPages: number };
    error?: string;
  }>({ url: `/api/battle-records/v2?${params.toString()}` });
}

export function fetchBattleRecordDetail(id: string) {
  return request<{
    success: boolean;
    data?: BattleRecordV2Detail;
    error?: string;
  }>({ url: `/api/battle-records/v2/${id}` });
}

// ===== Market =====
export type MarketLayer = 'common' | 'treasure' | 'heaven' | 'black';

export interface MarketListing {
  id: string;
  nodeId: string;
  layer: MarketLayer;
  price: number;
  quantity: number;
  name: string;
  type: string;
  rank?: string;
  quality?: string;
  element?: string;
  description?: string;
  isMystery?: boolean;
  mysteryMask?: { badge: string; disguisedName: string };
}

export interface SellPreviewItem {
  id: string;
  name: string;
  rank?: string;
  quality?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function fetchMarketListings(nodeId: string, layer: MarketLayer) {
  return request<{
    success: boolean;
    data?: MarketListing[];
    error?: string;
  }>({ url: `/api/market/${nodeId}?layer=${layer}` });
}

export function buyMarketItem(nodeId: string, listingId: string, quantity = 1) {
  return request<{
    success: boolean;
    data?: { message?: string };
    error?: string;
  }>({
    url: `/api/market/${nodeId}/buy`,
    method: 'POST',
    data: { listingId, quantity },
  });
}

export function sellPreview(itemType: 'material' | 'artifact') {
  return request<{
    success: boolean;
    sessionId?: string;
    mode?: string;
    items?: SellPreviewItem[];
    totalSpiritStones?: number;
    appraisal?: { rating: string; comment: string };
    error?: string;
  }>({
    url: '/api/market/sell',
    method: 'POST',
    data: { phase: 'preview', itemType },
  });
}

export function sellConfirm(sessionId: string) {
  return request<{
    success: boolean;
    gainedSpiritStones?: number;
    soldItems?: unknown[];
    error?: string;
  }>({
    url: '/api/market/sell',
    method: 'POST',
    data: { phase: 'confirm', sessionId },
  });
}

// ===== Rankings =====
export type RankingItemType = 'artifact' | 'skill' | 'elixir' | 'technique';

export interface BattleRankingItem {
  id: string;
  name: string;
  title?: string;
  realm: string;
  realm_stage: string;
  rank: number;
  is_new_comer: boolean;
  faction?: string;
}

export interface ItemRankingEntry {
  id: string;
  rank: number;
  name: string;
  itemType: RankingItemType;
  quality?: string;
  ownerName: string;
  score: number;
  element?: string;
  slot?: string;
}

export function fetchBattleRankings() {
  return request<{
    success: boolean;
    data?: BattleRankingItem[];
    error?: string;
  }>({ url: '/api/rankings' });
}

export function fetchItemRankings(type: RankingItemType) {
  return request<{
    success: boolean;
    data?: ItemRankingEntry[];
    error?: string;
  }>({ url: `/api/rankings/items?type=${type}` });
}

export function fetchMyRank() {
  return request<{
    success: boolean;
    data?: { rank: number | null; remainingChallenges: number; isProtected: boolean };
    error?: string;
  }>({ url: '/api/rankings/my-rank' });
}

// ===== Mail =====
export interface MailAttachment {
  type: 'material' | 'consumable' | 'artifact' | 'spirit_stones' | 'cultivation_exp' | 'comprehension_insight';
  name: string;
  quantity: number;
}

export interface MailRecord {
  id: string;
  title: string;
  content: string;
  attachments: MailAttachment[];
  isRead: boolean;
  isClaimed: boolean;
  createdAt: string | null;
}

export function fetchMails(page = 1, pageSize = 20) {
  return request<{
    success: boolean;
    mails?: MailRecord[];
    pagination?: { page: number; pageSize: number; hasMore: boolean };
    error?: string;
  }>({ url: `/api/cultivator/mail?page=${page}&pageSize=${pageSize}` });
}

export function claimMail(mailId: string) {
  return request<{
    success: boolean;
    message?: string;
    gains?: unknown[];
    error?: string;
  }>({
    url: '/api/cultivator/mail/claim',
    method: 'POST',
    data: { mailId },
  });
}

export function claimAllMails() {
  return request<{
    success: boolean;
    message?: string;
    totalClaimed?: number;
    error?: string;
  }>({
    url: '/api/cultivator/mail/claim-all',
    method: 'POST',
  });
}

export function readMail(mailId: string) {
  return request<{
    success: boolean;
    error?: string;
  }>({
    url: '/api/cultivator/mail/read',
    method: 'POST',
    data: { mailId },
  });
}

export function readAllMails() {
  return request<{
    success: boolean;
    error?: string;
  }>({
    url: '/api/cultivator/mail/read-all',
    method: 'POST',
  });
}

export function fetchUnreadMailCount() {
  return request<{
    success: boolean;
    count?: number;
    error?: string;
  }>({ url: '/api/cultivator/mail/unread-count' });
}

// ===== Redeem Code =====
export function claimRedeemCode(code: string) {
  return request<{
    success: boolean;
    message?: string;
    rewards?: unknown[];
    error?: string;
  }>({
    url: '/api/cultivator/redeem-code/claim',
    method: 'POST',
    data: { code },
  });
}

// ===== World Chat =====
export interface WorldChatMessage {
  id: string;
  senderUserId: string;
  senderCultivatorId: string;
  senderName: string;
  senderRealm: string;
  senderRealmStage: string;
  messageType: 'text' | 'item_showcase';
  textContent?: string;
  payload?: unknown;
  createdAt: string | null;
}

export function fetchWorldChatMessages(limit = 30) {
  return request<{
    success: boolean;
    data?: WorldChatMessage[];
    error?: string;
  }>({ url: `/api/world-chat/messages?limit=${limit}` });
}

export function sendWorldChatMessage(text: string) {
  return request<{
    success: boolean;
    data?: WorldChatMessage;
    error?: string;
    remainingSeconds?: number;
  }>({
    url: '/api/world-chat/messages',
    method: 'POST',
    data: { messageType: 'text', textContent: text },
  });
}

export function sendWorldChatShowcase(payload: {
  itemType: 'artifact' | 'material' | 'consumable';
  itemId: string;
  text?: string;
}) {
  return request<{
    success: boolean;
    data?: WorldChatMessage;
    error?: string;
    remainingSeconds?: number;
  }>({
    url: '/api/world-chat/messages',
    method: 'POST',
    data: { messageType: 'item_showcase', ...payload },
  });
}

// ===== Auction =====
export type AuctionLayer = 'common' | 'treasure' | 'heaven' | 'black';

export interface AuctionListing {
  id: string;
  sellerName: string;
  sellerRealm: string;
  name: string;
  quality?: string;
  rank?: string;
  element?: string;
  slot?: string;
  price: number;
  itemType: string;
  description?: string;
  createdAt: string | null;
}

export function fetchAuctionListings(params: {
  page?: number;
  pageSize?: number;
  itemType?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.itemType) query.set('itemType', params.itemType);
  if (params.minPrice) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
  return request<{
    success: boolean;
    data?: AuctionListing[];
    pagination?: { page: number; pageSize: number; total: number; totalPages: number };
    error?: string;
  }>({ url: `/api/auction/listings?${query.toString()}` });
}

export function buyAuctionItem(listingId: string) {
  return request<{
    success: boolean;
    message?: string;
    error?: string;
  }>({
    url: '/api/auction/buy',
    method: 'POST',
    data: { listingId },
  });
}

export function listAuctionItem(params: {
  itemType: 'artifact' | 'material' | 'consumable';
  itemId: string;
  price: number;
}) {
  return request<{
    success: boolean;
    listing?: AuctionListing;
    error?: string;
  }>({
    url: '/api/auction/list',
    method: 'POST',
    data: params,
  });
}

export function cancelAuctionListing(listingId: string) {
  return request<{
    success: boolean;
    error?: string;
  }>({
    url: `/api/auction/${listingId}`,
    method: 'DELETE',
  });
}
