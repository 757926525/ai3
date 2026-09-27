import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

export const runtime = 'edge';

// Structured 5-Part Prompt Fidelity Expander
export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = 'en', cfApiToken: clientCfToken, cfAccountId: clientCfAccount } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ success: false, error: '请输入待补全的提示词' }, { status: 400 });
    }

    const cleanText = text.trim();
    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    // 1. Structural 5-part prompt auto-expander (Subject + Style + Scene + Lighting + Master Quality)
    if (cfApiToken && cfAccountId) {
      try {
        const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
        const systemPrompt = `You are a professional AI image prompt engineer. Reconstruct the given short prompt into a structured 5-part AI art prompt in English:
1. Core Subject with weight: (subject:1.35)
2. Artistic Style with weight: (style:1.2)
3. Scene & Background Details
4. Professional Studio Lighting (volumetric lighting, cinematic shadows)
5. Masterpiece Quality Boosters (8k resolution, photorealistic, Octane render, sharp focus).

Return ONLY the final English prompt text without preamble or quotes.`;

        const res = await fetchWithRetry(cfEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: cleanText },
            ],
            max_tokens: 300,
          }),
          timeoutMs: 10000,
          maxRetries: 2,
        });

        if (res.ok) {
          const json = await res.json();
          const expanded = json?.result?.response?.trim();
          if (expanded) {
            return NextResponse.json({
              success: true,
              data: { translatedText: expanded.replace(/^["']|["']$/g, '') },
            });
          }
        }
      } catch (e) {
        // Fallback to MyMemory
      }
    }

    // 2. Free Open Translation & Rule-based 5-part struct fallback
    try {
      const langPair = targetLang === 'en' ? 'zh|en' : 'en|zh';
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${langPair}`;

      const res = await fetchWithRetry(myMemoryUrl, { timeoutMs: 8000, maxRetries: 2 });
      if (res.ok) {
        const json = await res.json();
        const translated = json?.responseData?.translatedText;
        if (translated && typeof translated === 'string') {
          const structuredText = `(${translated.trim()}:1.35), (cinematic style:1.2), atmospheric background, professional studio lighting, masterpiece, best quality, 8k resolution, sharp focus`;
          return NextResponse.json({
            success: true,
            data: { translatedText: structuredText },
          });
        }
      }
    } catch (e) {
      // Fallback
    }

    const defaultStructured = `(${cleanText}:1.35), (masterpiece style:1.2), detailed scene, studio lighting, 8k resolution, photorealistic`;
    return NextResponse.json({
      success: true,
      data: { translatedText: defaultStructured, fallbackUsed: true },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || '扩写失败' }, { status: 500 });
  }
}
