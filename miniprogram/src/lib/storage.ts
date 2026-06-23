import Taro from '@tarojs/taro';

export function getStorageValue<TValue>(key: string): TValue | null {
  try {
    const value = Taro.getStorageSync<TValue>(key);
    return value === '' || value === undefined ? null : value;
  } catch {
    return null;
  }
}

export function setStorageValue<TValue>(key: string, value: TValue) {
  Taro.setStorageSync(key, value);
}

export function removeStorageValue(key: string) {
  Taro.removeStorageSync(key);
}
