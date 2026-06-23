import { getStorageValue, removeStorageValue, setStorageValue } from '@/lib/storage';

const SESSION_TOKEN_KEY = 'daoyou.sessionToken';

export function getSessionToken() {
  return getStorageValue<string>(SESSION_TOKEN_KEY);
}

export function setSessionToken(token: string) {
  setStorageValue(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken() {
  removeStorageValue(SESSION_TOKEN_KEY);
}

export function hasSessionToken() {
  return Boolean(getSessionToken());
}
