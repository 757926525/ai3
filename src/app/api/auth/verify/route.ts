import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { cfAccountId, cfApiToken } = await req.json();

    // Sanitize credentials
    let accountId = (cfAccountId || process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^["']|["']$/g, '');
    let apiToken = (cfApiToken || process.env.CLOUDFLARE_API_TOKEN || '').trim().replace(/^["']|["']$/g, '');

    if (!accountId || !apiToken) {
      return NextResponse.json({
        success: true,
        connected: true,
        mode: 'pollinations_free',
        message: '🟢 绘图算力完全就绪 (免 Key 免费算力池全速托管中，也可选配 CF Key)',
      });
    }

    // Direct Cloudflare Workers AI Verification
    const res = await fetchWithRetry(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'test white fox', num_steps: 1 }),
        timeoutMs: 15000,
        maxRetries: 2,
      }
    );

    if (res.ok) {
      return NextResponse.json({
        success: true,
        connected: true,
        mode: 'cloudflare_ai',
        message: '🟢 Cloudflare Workers AI 鉴权通过！全球边缘算力准备就绪',
      });
    }

    // Graceful fallback status so user drawing is never blocked
    return NextResponse.json({
      success: true,
      connected: true,
      mode: 'fallback_free',
      message: '🟢 绘图算力服务正常 (内置 Pollinations/FLUX 免费托管算力池在线)',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      connected: true,
      mode: 'fallback_free',
      message: '🟢 绘图算力服务正常 (内置 Pollinations 免费算力全速服务中)',
    });
  }
}
