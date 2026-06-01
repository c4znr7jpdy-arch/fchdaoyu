import { GameSceneFrame } from '@app/components/game-shell';
import { InkButton } from '@app/components/ui/InkButton';
import { InkInput } from '@app/components/ui/InkInput';
import { InkSelect } from '@app/components/ui/InkSelect';
import { findLlmProvider, LLM_PROVIDERS } from '@shared/config/llmProviders';
import { useState } from 'react';

const STORAGE_KEY = 'daoyou_llm_config';

function readStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  return null;
}

const DEFAULT_PROVIDER = LLM_PROVIDERS[0].id;

export default function LlmConfigPage() {
  const stored = readStoredConfig();
  const [provider, setProvider] = useState(stored?.provider || DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState(stored?.apiKey || '');
  const [model, setModel] = useState(stored?.model || '');
  const [fastModel, setFastModel] = useState(stored?.fastModel || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [hasConfig, setHasConfig] = useState(!!stored);

  const currentProvider = findLlmProvider(provider);

  const canSubmit =
    provider && apiKey && model && fastModel && !loading;

  const handleProviderChange = (value: string) => {
    setProvider(value);
    const next = findLlmProvider(value);
    if (next) {
      setModel(next.model);
      setFastModel(next.fastModel);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setMessage(null);

    try {
      const config = {
        provider,
        apiKey,
        // baseUrl 由 Provider 决定，不允许用户自定义
        baseUrl: currentProvider?.baseUrl || '',
        model,
        fastModel,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasConfig(true);
      setMessage({ type: 'success', text: '配置已保存到浏览器本地。' });
    } catch {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    const defaults = LLM_PROVIDERS[0];
    setProvider(defaults.id);
    setApiKey('');
    setModel(defaults.model);
    setFastModel(defaults.fastModel);
    setHasConfig(false);
    setMessage({ type: 'success', text: '已清除本地配置，恢复为服务器默认模型。' });
  };

  return (
    <GameSceneFrame
      variant="lite"
      title="模型配置"
      description="为当前角色配置独立的 LLM 服务商与模型参数。Base URL 由所选服务商自动确定，不支持自定义。配置保存在浏览器本地，仅当前设备生效。"
    >
      <div className="space-y-5">
        <InkSelect
          label="服务商"
          value={provider}
          onChange={handleProviderChange}
        >
          {LLM_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </InkSelect>

        <InkInput
          label="API Key"
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={setApiKey}
        />

        {/* Base URL — 只读展示，由 Provider 自动确定，不允许自定义 */}
        <div className="flex flex-col gap-1">
          <span className="text-ink font-semibold tracking-[0.08em]">
            Base URL
          </span>
          <span className="text-ink-secondary bg-ink/5 font-mono text-sm rounded-md px-3 py-2 select-all">
            {currentProvider?.baseUrl || '—'}
          </span>
          <span className="text-ink-secondary text-[0.82rem]">
            由所选服务商自动确定，不支持自定义输入
          </span>
        </div>

        <InkInput
          label="普通模型"
          placeholder="如 deepseek-chat"
          value={model}
          onChange={setModel}
        />

        <InkInput
          label="Fast 模型"
          placeholder="如 deepseek-chat"
          value={fastModel}
          onChange={setFastModel}
        />

        <div className="flex flex-wrap items-center gap-3">
          <InkButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? '保存中...' : '保存配置'}
          </InkButton>

          {hasConfig && (
            <InkButton
              variant="secondary"
              onClick={handleClear}
              disabled={loading}
            >
              清除配置
            </InkButton>
          )}

          {message && (
            <span
              className={`text-sm ${
                message.type === 'success' ? 'text-teal' : 'text-crimson'
              }`}
            >
              {message.text}
            </span>
          )}
        </div>

        <div className="border-ink/10 border-t pt-4">
          <p className="text-ink-secondary text-sm leading-6">
            配置保存在浏览器 localStorage 中，仅当前设备生效，更换浏览器或清除缓存后需要重新配置。
            <br />
            API Key 仅在前端本地存储，服务端通过请求头获取并调用，不会在服务器持久化保存。
          </p>
        </div>
      </div>
    </GameSceneFrame>
  );
}
