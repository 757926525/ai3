import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { parseAndWeightPrompt } from '@/lib/promptPreprocessor';

export const runtime = 'edge';

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

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

    // 1. Cloudflare Workers AI Qwen LLM Engine (China-Accessible & High Nuance)
    if (cfApiToken && cfAccountId) {
      try {
        const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/qwen/qwen1.5-7b-chat`;
        const systemPrompt = `You are an expert AI prompt translator. Translate the following text into ${targetLangName}. Output ONLY the direct translated text, without quotes or conversational filler:`;

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
          const translated = json?.result?.response?.trim();
          if (translated) {
            const cleanTranslated = decodeHtmlEntities(translated.replace(/^["']|["']$/g, ''));
            return NextResponse.json({
              success: true,
              data: { translatedText: cleanTranslated, originalText: cleanText, targetLang: finalTargetLang, engine: 'Cloudflare Qwen AI Engine (中国无障碍)' },
            });
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Fast Google GTX Translation Engine
    try {
      const gtxTarget = finalTargetLang === 'zh' ? 'zh-CN' : finalTargetLang;
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${gtxTarget}&dt=t&q=${encodeURIComponent(cleanText)}`;
      const gtxRes = await fetchWithRetry(gtxUrl, { timeoutMs: 6000, maxRetries: 1 });

      if (gtxRes.ok) {
        const json = await gtxRes.json();
        if (Array.isArray(json) && Array.isArray(json[0])) {
          const translatedSegments = json[0]
            .map((item: any) => (Array.isArray(item) && item[0] ? item[0] : ''))
            .filter(Boolean);
          if (translatedSegments.length > 0) {
            const rawText = translatedSegments.join('').trim().replace(/^["']|["']$/g, '');
            const translatedText = decodeHtmlEntities(rawText);
            if (translatedText) {
              return NextResponse.json({
                success: true,
                data: { translatedText, originalText: cleanText, targetLang: finalTargetLang, engine: 'Google GTX Engine' },
              });
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    // 3. MyMemory Translation API Fallback
    try {
      const langPair = hasChinese ? `zh|${finalTargetLang}` : `en|${finalTargetLang}`;
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${encodeURIComponent(langPair)}`;
      const res = await fetchWithRetry(myMemoryUrl, { timeoutMs: 8000, maxRetries: 2 });
      if (res.ok) {
        const json = await res.json();
        const translated = json?.responseData?.translatedText;
        if (translated && typeof translated === 'string' && !translated.includes('NO QUERY SPECIFIED')) {
          const cleanTranslated = decodeHtmlEntities(translated.trim());
          return NextResponse.json({
            success: true,
            data: { translatedText: cleanTranslated, engine: 'MyMemory API' },
          });
        }
      }
    } catch {
      // Fallback
    }

    // 4. Offline Dictionary Preprocessor Fallback (Guaranteed to translate art style keywords in China)
    let dictTranslated = cleanText;
    if (finalTargetLang === 'en' && hasChinese) {
      dictTranslated = parseAndWeightPrompt(cleanText, 0.65);
    }

    return NextResponse.json({
      success: true,
      data: { translatedText: dictTranslated, originalText: cleanText, targetLang: finalTargetLang, engine: '内置高精度艺术词库 (中国离线无障碍)' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || '多语种翻译失败' }, { status: 500 });
  }
}
