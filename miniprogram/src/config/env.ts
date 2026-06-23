import Taro from '@tarojs/taro';

type MiniProgramEnvVersion = 'develop' | 'trial' | 'release';

type RuntimeConfig = {
  apiBaseUrl: string;
};

const configs: Record<MiniProgramEnvVersion, RuntimeConfig> = {
  develop: {
    apiBaseUrl: 'http://127.0.0.1:5173',
  },
  trial: {
    apiBaseUrl: 'https://api.example.com',
  },
  release: {
    apiBaseUrl: 'https://api.example.com',
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
