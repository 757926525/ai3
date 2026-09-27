import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      targetLang = 'mutual',
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      customChatKey,
    } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ success: false, error: '请输入待翻译文本' }, { status: 400 });
    }

    const cleanText = text.trim();
    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    // Detect if input contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(cleanText);

    // Auto-detect direction for mutual translation
    let finalTargetLang = targetLang;
    if (targetLang === 'mutual' || targetLang === 'auto') {
      finalTargetLang = hasChinese ? 'en' : 'zh';
    } else if (targetLang === 'en' && !hasChinese) {
      // If user requested default translation but text is already English, toggle to Chinese
      finalTargetLang = 'zh';
    }

    const targetLangMap: Record<string, string> = {
      en: 'English',
      zh: 'Simplified Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      fr: 'French',
      de: 'German',
      es: 'Spanish',
      ru: 'Russian',
    };

    const targetLangName = targetLangMap[finalTargetLang] || 'English';

    // 1. Cloudflare LLM Multi-Language Translation
    if (cfApiToken && cfAccountId) {
      try {
        const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
        const prompt = `You are a professional multi-language translator. Translate the following text into ${targetLangName}. Output ONLY the direct translated text without explanations or quotes:\n\n${cleanText}`;

        const res = await fetchWithRetry(cfEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
          }),
          timeoutMs: 12000,
          maxRetries: 2,
        });

        if (res.ok) {
          const json = await res.json();
          const translated = json?.result?.response?.trim();
          if (translated) {
            return NextResponse.json({
              success: true,
              data: { translatedText: translated.replace(/^["']|["']$/g, '') },
            });
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Open Translation API Fallback
    try {
      const langPair = hasChinese ? 'zh|en' : 'en|zh';
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${encodeURIComponent(langPair)}`;
      const res = await fetchWithRetry(myMemoryUrl, { timeoutMs: 8000, maxRetries: 2 });
      if (res.ok) {
        const json = await res.json();
        const translated = json?.responseData?.translatedText;
        if (translated && typeof translated === 'string') {
          return NextResponse.json({
            success: true,
            data: { translatedText: translated },
          });
        }
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      data: { translatedText: cleanText, fallbackUsed: true },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || '多语种翻译失败' }, { status: 500 });
  }
}
