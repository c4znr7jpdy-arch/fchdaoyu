import { GameSceneFrame } from '@app/components/game-shell';
import { InkButton } from '@app/components/ui/InkButton';
import { InkInput } from '@app/components/ui/InkInput';
import { InkSelect } from '@app/components/ui/InkSelect';
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

const PROVIDERS = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'ark', label: '火山方舟 (ARK)' },
  { value: 'kimi', label: 'Kimi (Moonshot)' },
  { value: 'alibaba', label: '阿里云 (Qwen)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai', label: 'OpenAI / 兼容' },
];

const PROVIDER_DEFAULTS: Record<
  string,
  { baseUrl: string; model: string; fastModel: string }
> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    fastModel: 'deepseek-chat',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'kimi-k2.6',
    fastModel: 'kimi-k2.6',
  },
  alibaba: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    fastModel: 'qwen-turbo',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    fastModel: 'gpt-4o-mini',
  },
  openrouter: {
    baseUrl: '',
    model: '',
    fastModel: '',
  },
  ark: {
    baseUrl: '',
    model: '',
    fastModel: '',
  },
};

export default function LlmConfigPage() {
  const stored = readStoredConfig();
  const [provider, setProvider] = useState(stored?.provider || 'deepseek');
  const [apiKey, setApiKey] = useState(stored?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(stored?.baseUrl || '');
  const [model, setModel] = useState(stored?.model || '');
  const [fastModel, setFastModel] = useState(stored?.fastModel || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [hasConfig, setHasConfig] = useState(!!stored);

  const canSubmit =
    provider && apiKey && model && fastModel && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setMessage(null);

    try {
      const config = {
        provider,
        apiKey,
        baseUrl: baseUrl || undefined,
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
    setProvider('deepseek');
    setApiKey('');
    setBaseUrl('');
    setModel('');
    setFastModel('');
    setHasConfig(false);
    setMessage({ type: 'success', text: '已清除本地配置，恢复为服务器默认模型。' });
  };

  return (
    <GameSceneFrame
      variant="lite"
      title="模型配置"
      description="为当前角色配置独立的 LLM Provider 与模型参数。配置保存在浏览器本地，仅当前设备生效。"
    >
      <div className="space-y-5">
        <InkSelect
          label="Provider"
          value={provider}
          onChange={(value) => {
            setProvider(value);
            const defaults = PROVIDER_DEFAULTS[value];
            if (defaults) {
              setBaseUrl(defaults.baseUrl);
              setModel(defaults.model);
              setFastModel(defaults.fastModel);
            }
          }}
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
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

        <InkInput
          label="Base URL（可选）"
          placeholder="https://api.example.com/v1"
          value={baseUrl}
          onChange={setBaseUrl}

        />

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
