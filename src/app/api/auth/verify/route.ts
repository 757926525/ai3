import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { cfAccountId, cfApiToken } = await req.json();

    const accountId = cfAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = cfApiToken || process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { success: false, connected: false, message: '未配置 Cloudflare Account ID 或 Token' },
        { status: 400 }
      );
    }

    const res = await fetchWithRetry(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'a cute fox', num_steps: 1 }),
        timeoutMs: 15000,
        maxRetries: 1,
      }
    );

    if (res.ok) {
      return NextResponse.json({
        success: true,
        connected: true,
        message: '✓ Cloudflare Workers AI 鉴权通过！边缘算力准备就绪',
      });
    }

    return NextResponse.json({
      success: false,
      connected: false,
      message: 'Cloudflare AI 鉴权未通过，请检查 Account ID 和 Token',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      message: `无法连通 Cloudflare 节点: ${err.message}`,
    });
  }
}
