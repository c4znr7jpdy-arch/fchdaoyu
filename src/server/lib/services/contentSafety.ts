import * as tencentcloud from 'tencentcloud-sdk-nodejs';

const ModerationClient = tencentcloud.moderation.v20180709.Client;

let client: InstanceType<typeof ModerationClient> | null = null;

function getClient() {
  if (client) return client;

  const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
  const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

  if (!secretId || !secretKey) {
    console.warn('[contentSafety] TENCENT_CLOUD_SECRET_ID/SECRET_KEY not set, content safety disabled');
    return null;
  }

  client = new ModerationClient({
    credential: { secretId, secretKey },
    region: 'ap-guangzhou',
    profile: { httpProfile: { endpoint: 'moderation.tencentcloudapi.com' } },
  });

  return client;
}

export interface ModerationResult {
  allowed: boolean;
  label?: string;
  suggestion?: string;
  detail?: string;
}

/**
 * Check text content against Tencent Cloud text moderation API.
 * Returns { allowed: true } if safe, { allowed: false, label, detail } if blocked.
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  const c = getClient();
  if (!c) {
    // Safety API not configured — allow by default in dev
    return { allowed: true };
  }

  try {
    const result = await c.TextModeration({
      Content: text,
      ContentType: 2, // plain text
    });

    const suggest = result.Result?.Suggest ?? 'Pass';
    const label = result.Result?.Label ?? '';
    const subLabel = result.Result?.SubLabel ?? '';
    const detail = result.Result?.DetailLabel ?? '';

    if (suggest === 'Block') {
      return { allowed: false, label: subLabel || label, suggestion: suggest, detail };
    }

    // "Review" also blocks in our case — let human review happen offline
    if (suggest === 'Review') {
      return { allowed: false, label: subLabel || label, suggestion: suggest, detail };
    }

    return { allowed: true, label: subLabel || label, suggestion: suggest };
  } catch (err) {
    console.error('[contentSafety] Moderation API error:', err);
    // On API error, allow by default to avoid blocking all chat
    return { allowed: true };
  }
}
