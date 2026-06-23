import { defineConfig } from '@tarojs/cli';
import { resolve } from 'node:path';

export default defineConfig(async () => ({
  projectName: 'daoyou-miniprogram',
  date: '2026-06-09',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  alias: {
    '@': resolve(__dirname, '..', 'src'),
    '@shared': resolve(__dirname, '..', '..', 'src', 'shared'),
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
      },
    },
  },
}));
