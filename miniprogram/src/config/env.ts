import Taro from '@tarojs/taro';

type MiniProgramEnvVersion = 'develop' | 'trial' | 'release';

type RuntimeConfig = {
  apiBaseUrl: string;
};

const configs: Record<MiniProgramEnvVersion, RuntimeConfig> = {
  develop: {
    apiBaseUrl: 'http://47.242.208.64',
  },
  trial: {
    apiBaseUrl: 'http://47.242.208.64',
  },
  release: {
    apiBaseUrl: 'http://47.242.208.64',
  },
};

export function getMiniProgramEnvVersion(): MiniProgramEnvVersion {
  try {
    return Taro.getAccountInfoSync().miniProgram.envVersion;
  } catch {
    return 'develop';
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  return configs[getMiniProgramEnvVersion()];
}

export const API_BASE_URL = getRuntimeConfig().apiBaseUrl;
