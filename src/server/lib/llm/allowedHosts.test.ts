import { describe, it, expect } from 'vitest';
import { ALLOWED_LLM_HOSTS, LLM_PROVIDERS } from '@shared/config/llmProviders';
import { validateLlmBaseUrl, getAllowedLlmHosts } from './allowedHosts';

// ---- 共享配置一致性（防止 host 与 baseUrl 脱节） ----

describe('LLM_PROVIDERS 配置一致性', () => {
  it.each(LLM_PROVIDERS.map((p) => [p.id, p]))(
    '%s: host 必须能从 baseUrl 中解析得到',
    (_id, provider) => {
      const parsed = new URL(provider.baseUrl);
      expect(parsed.hostname).toBe(provider.host);
    },
  );

  it.each(LLM_PROVIDERS.map((p) => [p.id, p]))(
    '%s: baseUrl 必须使用 HTTPS',
    (_id, provider) => {
      expect(provider.baseUrl).toMatch(/^https:\/\//);
    },
  );

  it('所有 id 必须唯一', () => {
    const ids = LLM_PROVIDERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('所有 host 必须唯一', () => {
    const hosts = LLM_PROVIDERS.map((p) => p.host);
    expect(new Set(hosts).size).toBe(hosts.length);
  });

  it('ALLOWED_LLM_HOSTS 应与 LLM_PROVIDERS 数量一致', () => {
    expect(ALLOWED_LLM_HOSTS.size).toBe(LLM_PROVIDERS.length);
  });
});

// ---- 白名单命中（从共享配置动态生成） ----

describe('validateLlmBaseUrl', () => {
  it.each(LLM_PROVIDERS.map((p) => [p.label, p.baseUrl]))(
    '应接受白名单内的域名: %s (%s)',
    (_label, url) => {
      expect(validateLlmBaseUrl(url)).not.toBeNull();
    },
  );

  // ---- 拒绝非法域名 ----

  it.each([
    ['ngrok 隧道', 'https://xxxx.ngrok-free.app/v1'],
    ['cloudflare 隧道', 'https://my-proxy.trycloudflare.com/v1'],
    ['localhost', 'https://localhost:3456/v1'],
    ['内网 IP', 'https://192.168.1.100:8080/v1'],
    ['自建服务器', 'https://my-llm-server.example.com/v1'],
    ['攻击者域名', 'https://evil-llm.com/v1'],
    ['仿冒域名', 'https://api.deepseek.com.evil.com/v1'],
  ])('应拒绝非白名单域名: %s (%s)', (_label, url) => {
    expect(validateLlmBaseUrl(url)).toBeNull();
  });

  // ---- 协议限制 ----

  it('应拒绝 HTTP 协议（仅允许 HTTPS）', () => {
    expect(validateLlmBaseUrl('http://api.deepseek.com/v1')).toBeNull();
  });

  it('应拒绝无效 URL', () => {
    expect(validateLlmBaseUrl('not-a-url')).toBeNull();
    expect(validateLlmBaseUrl('')).toBeNull();
    expect(validateLlmBaseUrl('ftp://api.deepseek.com/v1')).toBeNull();
  });

  // ---- 大小写不敏感 ----

  it('域名匹配应不区分大小写', () => {
    expect(validateLlmBaseUrl('https://API.DEEPSEEK.COM/v1')).not.toBeNull();
    expect(validateLlmBaseUrl('https://Api.DeepSeek.Com/v1')).not.toBeNull();
  });
});

describe('getAllowedLlmHosts', () => {
  it('应返回与 LLM_PROVIDERS 等长的白名单数组', () => {
    const hosts = getAllowedLlmHosts();
    expect(hosts.length).toBe(LLM_PROVIDERS.length);
  });

  it('应包含所有供应商的 host', () => {
    const hosts = getAllowedLlmHosts();
    for (const provider of LLM_PROVIDERS) {
      expect(hosts).toContain(provider.host);
    }
  });

  it('不应包含重复项', () => {
    const hosts = getAllowedLlmHosts();
    expect(new Set(hosts).size).toBe(hosts.length);
  });
});
