import { AlibabaLanguageModelOptions, createAlibaba } from '@ai-sdk/alibaba';
import { createDeepSeek, DeepSeekLanguageModelOptions } from '@ai-sdk/deepseek';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getCurrentContext } from '@server/lib/http/context';
import { generateText, streamText, ToolSet } from 'ai';
import { jsonrepair } from 'jsonrepair';
import z from 'zod';

/**
 * 注入 Schema 到 System Prompt
 */
const injectSystemWithSchema = (system: string, schema: z.ZodType<unknown>) => {
  const jsonSchema = schema.toJSONSchema();
  return `${system}

[输出 JSON 格式要求]
你必须遵循以下 JSON Schema 进行输出：
${JSON.stringify(jsonSchema, null, 2)}`;
};

/**
 * 从请求上下文读取用户自定义 LLM 配置
 */
export type UserLlmConfig = {
  provider: string;
  apiKey: string;
  baseUrl: string | null;
  model: string;
  fastModel: string;
};

function getUserLlmConfig(): UserLlmConfig | undefined {
  try {
    const ctx = getCurrentContext();
    return ctx.get('llmConfig');
  } catch {
    return undefined;
  }
}

export type LlmOverrideConfig = {
  provider: string;
  apiKey: string;
  baseUrl?: string | null;
  model: string;
  fastModel: string;
};

function getEffectiveProvider(
  override?: LlmOverrideConfig,
): string | undefined {
  return (override ?? getUserLlmConfig())?.provider;
}

function kimiTemperature(
  override?: LlmOverrideConfig,
): number | undefined {
  return getEffectiveProvider(override) === 'kimi' ? 0.6 : undefined;
}

/**
 * 获取 Provider
 */
function getProvider(override?: LlmOverrideConfig) {
  const userConfig = override ?? getUserLlmConfig();

  if (userConfig) {
    if (userConfig.provider === 'openrouter') {
      return createOpenRouter({ apiKey: userConfig.apiKey });
    }
    return createDeepSeek({
      apiKey: userConfig.apiKey,
      baseURL: userConfig.baseUrl ?? undefined,
    });
  }

  if (process.env.PROVIDER_CHOOSE === 'ark') {
    return createDeepSeek({
      baseURL: process.env.ARK_BASE_URL,
      apiKey: process.env.ARK_API_KEY,
    });
  }
  if (process.env.PROVIDER_CHOOSE === 'kimi') {
    return createDeepSeek({
      apiKey: process.env.KIMI_API_KEY,
      baseURL: process.env.KIMI_BASE_URL,
    });
  }
  if (process.env.PROVIDER_CHOOSE === 'openrouter') {
    return createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  if (process.env.PROVIDER_CHOOSE === 'deepseek') {
    return createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL,
    });
  }
  return createDeepSeek({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

const getArkRandomModel = () => {
  const models = process.env.ARK_MODEL_USE!.split(',');
  return models[Math.floor(Math.random() * models.length)];
};

/**
 * 获取 Model 实例
 */
export function getModel(
  fast: boolean = false,
  override?: LlmOverrideConfig,
) {
  const userConfig = override ?? getUserLlmConfig();

  if (userConfig) {
    const model = fast ? userConfig.fastModel : userConfig.model;
    if (userConfig.provider === 'alibaba') {
      const alibabaProvider = createAlibaba({
        apiKey: userConfig.apiKey,
        baseURL: userConfig.baseUrl ?? undefined,
      });
      return alibabaProvider.languageModel(model);
    }
    const provider = getProvider(override);
    return provider(model);
  }

  const provider = getProvider(override);
  if (process.env.PROVIDER_CHOOSE === 'ark') {
    const model = fast ? process.env.ARK_MODEL_FAST_USE : getArkRandomModel();
    return provider(model!);
  } else if (process.env.PROVIDER_CHOOSE === 'kimi') {
    const model = fast
      ? process.env.KIMI_MODEL_FAST_USE
      : process.env.KIMI_MODEL_USE;
    return provider(model!);
  } else if (process.env.PROVIDER_CHOOSE === 'alibaba') {
    const model = fast
      ? process.env.ALIBABA_MODEL_FAST_USE
      : process.env.ALIBABA_MODEL_USE;
    const alibabaProvider = createAlibaba({
      apiKey: process.env.ALIBABA_API_KEY,
      baseURL: process.env.ALIBABA_BASE_URL,
    });
    return alibabaProvider.languageModel(model!);
  } else if (process.env.PROVIDER_CHOOSE === 'openrouter') {
    const model = fast
      ? process.env.OPENROUTER_MODEL_FAST_USE
      : process.env.OPENROUTER_MODEL_USE;
    return provider(model!);
  } else if (process.env.PROVIDER_CHOOSE === 'deepseek') {
    const model = fast
      ? process.env.DEEPSEEK_MODEL_FAST_USE
      : process.env.DEEPSEEK_MODEL_USE;
    return provider(model!);
  } else {
    const model = fast ? process.env.FAST_MODEL : process.env.OPENAI_MODEL;
    return provider(model!);
  }
}

/**
 * 通用直接生成 Text
 */
export async function text(
  prompt: string,
  userInput: string,
  fast: boolean = false,
  override?: LlmOverrideConfig,
) {
  const model = getModel(fast, override);
  const temperature = kimiTemperature(override);
  const res = await generateText({
    model,
    system: prompt,
    prompt: userInput,
    ...(temperature !== undefined && { temperature }),
    providerOptions: {
      deepseek: {
        thinking: { type: 'disabled' },
      } satisfies DeepSeekLanguageModelOptions,
      alibaba: {
        enableThinking: false,
        thinkingBudget: 2048,
      } satisfies AlibabaLanguageModelOptions,
    },
  });
  return res;
}

/**
 * 通用 Stream 生成 Text
 */
export function stream_text(
  prompt: string,
  userInput: string,
  fast: boolean = false,
  thinking: boolean = false,
) {
  const model = getModel(fast);
  const temperature = kimiTemperature();
  return streamText({
    model,
    system: prompt,
    prompt: userInput,
    ...(temperature !== undefined && { temperature }),
    onFinish: (res) => {
      console.debug('AI生成Text Stream：usage', res.usage);
    },
    providerOptions: {
      deepseek: {
        thinking: { type: thinking ? 'enabled' : 'disabled' },
      } satisfies DeepSeekLanguageModelOptions,
      alibaba: {
        enableThinking: thinking,
        thinkingBudget: 2048,
      } satisfies AlibabaLanguageModelOptions,
    },
  });
}

/**
 * 核心逻辑：生成结构化数据并进行手动校验与重试
 */
async function generateStructuredData<T>(
  prompt: string,
  userInput: string,
  options: {
    schema: z.ZodType<T>;
    schemaName?: string;
    schemaDescription?: string;
  },
  fast: boolean = false,
  thinking: boolean = false,
) {
  const maxRetries = 3;
  let lastError: z.ZodError<T> | undefined = undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 每次重试降低温度：1.0 -> 0.7 -> 0.4 (更加稳定)
    const kimiTemp = kimiTemperature();
    const temperature =
      kimiTemp !== undefined
        ? Math.max(0, kimiTemp - attempt * 0.2)
        : Math.max(0, 1 - attempt * 0.3);
    const model = getModel(fast);
    const res = await generateText({
      model,
      temperature,
      system: injectSystemWithSchema(prompt, options.schema),
      prompt: userInput,
      // output: Output.json(),
      providerOptions: {
        deepseek: {
          thinking: { type: thinking ? 'enabled' : 'disabled' },
        } satisfies DeepSeekLanguageModelOptions,
        alibaba: {
          enableThinking: thinking,
          thinkingBudget: 2048,
        } satisfies AlibabaLanguageModelOptions,
      },
    });
    let json;
    try {
      json = JSON.parse(res.output);
    } catch (error) {
      console.warn(`AI生成的JSON解析失败，尝试修复：${error}`);
      const repaired = jsonrepair(res.output);
      json = JSON.parse(repaired);
    }
    const parsed = options.schema.safeParse(json);
    if (parsed.success) {
      if (attempt > 0) {
        console.info(`结构化数据在第 ${attempt + 1} 次尝试成功。`);
      }
      return {
        ...res,
        object: parsed.data,
      };
    }

    console.warn(
      `第 ${attempt + 1} 次尝试结构化校验失败:`,
      z.treeifyError(parsed.error),
    );
    lastError = parsed.error;
  }

  throw new Error(
    `无法生成符合要求的结构化数据。尝试：${maxRetries}次。最后错误：${lastError?.message || '未知错误'}`,
  );
}

/**
 * 生成单一结构化对象
 */
export async function object<T>(
  prompt: string,
  userInput: string,
  options: {
    schemaName?: string;
    schemaDescription?: string;
    schema: z.ZodType<T>;
  },
  fast: boolean = false,
  thinking: boolean = false,
) {
  return generateStructuredData(prompt, userInput, options, fast, thinking);
}

/**
 * 生成结构化对象数组
 */
export async function objectArray<T>(
  prompt: string,
  userInput: string,
  options: {
    schemaName?: string;
    schemaDescription?: string;
    schema: z.ZodType<T>;
  },
  fast: boolean = false,
  thinking: boolean = false,
) {
  // 注意：options.schema 预期是一个数组类型的 Zod Schema (z.array(...))
  return generateStructuredData(prompt, userInput, options, fast, thinking);
}

/**
 * Tool 调用生成器
 */
export async function tool(
  prompt: string,
  userInput: string,
  tools: ToolSet,
  thinking: boolean = false,
) {
  const model = getModel();
  const temperature = kimiTemperature();
  const res = await generateText({
    model,
    system: prompt,
    prompt: userInput,
    tools,
    ...(temperature !== undefined && { temperature }),
    providerOptions: {
      deepseek: {
        thinking: { type: thinking ? 'enabled' : 'disabled' },
      } satisfies DeepSeekLanguageModelOptions,
      alibaba: {
        enableThinking: thinking,
        thinkingBudget: 2048,
      } satisfies AlibabaLanguageModelOptions,
    },
  });
  console.debug('AI工具调用完成：usage', res.usage);
  return res;
}
