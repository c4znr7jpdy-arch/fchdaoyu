import Taro from '@tarojs/taro';

type MiniProgramEnvVersion = 'develop' | 'trial' | 'release';

type RuntimeConfig = {
  apiBaseUrl: string;
};

const configs: Record<MiniProgramEnvVersion, RuntimeConfig> = {
  develop: {
    apiBaseUrl: 'https://xiuxianjyj.xin',
  },
  trial: {
    apiBaseUrl: 'https://xiuxianjyj.xin',
  },
  release: {
    apiBaseUrl: 'https://xiuxianjyj.xin',
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
