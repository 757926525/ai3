import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry, parseErrorResponse } from '@/lib/fetchWithRetry';
import { parseAndWeightPrompt, mergeNegativePrompts } from '@/lib/promptPreprocessor';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export const runtime = 'edge';

// Edge Server-Side Task & Hash Cache Memory Store
const edgeResultCache = new Map<string, { imageUrls: string[]; timestamp: number }>();
const taskStore = new Map<string, { status: 'processing' | 'completed' | 'failed'; result?: any; error?: string; createdAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function mapResolutionToBucket(w: number, h: number): { width: number; height: number; aspectRatio: string } {
  const aspect = w / h;
  if (aspect >= 1.5) return { width: 1280, height: 720, aspectRatio: '16:9' };
  if (aspect <= 0.65) return { width: 720, height: 1280, aspectRatio: '9:16' };
  if (aspect >= 1.2) return { width: 1024, height: 768, aspectRatio: '4:3' };
  if (aspect <= 0.8) return { width: 768, height: 1024, aspectRatio: '3:4' };
  return { width: 1024, height: 1024, aspectRatio: '1:1' };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    let {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      customWidth,
      customHeight,
      model = '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      sampler,
      steps = 25,
      guidance = 7.0,
      styleStrength = 0.65,
      seed,
      batchCount = 1,
      enableNsfw = true,
      autoUpscale = true,
      siliconApiKey: clientSiliconKey,
      openaiApiKey: clientOpenaiKey,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      enhancePrompt = true,
      asyncTask = false,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的正向提示词' },
        { status: 400 }
      );
    }

    if (enhancePrompt) {
      prompt = parseAndWeightPrompt(prompt, styleStrength);
    }

    negativePrompt = mergeNegativePrompts(negativePrompt, DEFAULT_SETTINGS.defaultNegativePrompt, enableNsfw);
    const baseSeed = seed ? Number(seed) : Math.floor(Math.random() * 899999) + 100000;

    const finalWidth = customWidth ? Number(customWidth) : Number(width) || 1024;
    const finalHeight = customHeight ? Number(customHeight) : Number(height) || 1024;
    const resBucket = mapResolutionToBucket(finalWidth, finalHeight);

    // Cache Hash check
    const cacheHash = `${model}_${prompt.trim()}_${resBucket.width}_${resBucket.height}_${steps}_${guidance}_${baseSeed}`;
    const cachedHit = edgeResultCache.get(cacheHash);
    if (cachedHit && Date.now() - cachedHit.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: {
          imageUrl: cachedHit.imageUrls[0],
          imageUrls: cachedHit.imageUrls,
          generationTimeMs: Date.now() - startTime,
          cached: true,
        },
      });
    }

    // Server-Side Credentials (NEVER exposed to frontend)
    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;
    const siliconApiKey = clientSiliconKey || process.env.SILICONFLOW_API_KEY;
    const openaiApiKey = clientOpenaiKey || process.env.OPENAI_API_KEY;

    const count = Math.min(Math.max(Number(batchCount) || 1, 1), 4);
    const generatedImages: string[] = [];

    const generateSingleWorkerAI = async (currentSeed: number): Promise<{ url: string; providerUsed: string }> => {
      const attemptedErrors: string[] = [];

      // 1. Server-Side Direct Cloudflare Workers AI Call
      if (cfApiToken && cfAccountId) {
        try {
          const cfModel = model.startsWith('@cf/') ? model : '@cf/stabilityai/stable-diffusion-xl-base-1.0';
          const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

          const cfPayload: any = {
            prompt: prompt.trim(),
            negative_prompt: negativePrompt,
            width: resBucket.width,
            height: resBucket.height,
            num_steps: Math.min(Math.max(Number(steps) || 25, 1), 50),
            guidance: Number(guidance) || 7.0,
            seed: currentSeed,
          };

          // Exponential backoff retries (3 attempts) on 429/timeouts
          const cfResponse = await fetchWithRetry(cfEndpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cfPayload),
            timeoutMs: 30000,
            maxRetries: 3,
          });

          if (cfResponse.ok) {
            const contentType = cfResponse.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const jsonResult = await cfResponse.json();
              if (jsonResult.result?.image) {
                const img = jsonResult.result.image.startsWith('data:')
                  ? jsonResult.result.image
                  : `data:image/png;base64,${jsonResult.result.image}`;
                return { url: img, providerUsed: 'Cloudflare Workers AI 官方画质引擎' };
              }
            }
            const arrayBuffer = await cfResponse.arrayBuffer();
            const base64 = arrayBufferToBase64(arrayBuffer);
            const mime = contentType.includes('image/jpeg') ? 'image/jpeg' : 'image/png';
            return { url: `data:${mime};base64,${base64}`, providerUsed: 'Cloudflare Workers AI 官方画质引擎' };
          } else {
            attemptedErrors.push(await parseErrorResponse(cfResponse, 'Cloudflare AI 节点繁忙'));
          }
        } catch (e: any) {
          attemptedErrors.push(`Cloudflare Workers AI 抛出错误: ${e.message}`);
        }
      }

      // 2. SiliconFlow Failover
      if (siliconApiKey) {
        try {
          const siliconRes = await fetchWithRetry('https://api.siliconflow.cn/v1/image/generations', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${siliconApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'black-forest-labs/FLUX.1-schnell',
              prompt: prompt.trim(),
              negative_prompt: negativePrompt,
              image_size: `${resBucket.width}x${resBucket.height}`,
              batch_size: 1,
              seed: currentSeed,
              num_inference_steps: Math.min(Number(steps) || 25, 50),
              guidance_scale: Number(guidance) || 7.0,
            }),
            timeoutMs: 30000,
            maxRetries: 2,
          });

          if (siliconRes.ok) {
            const sfJson = await siliconRes.json();
            if (sfJson.images && sfJson.images.length > 0) {
              return { url: sfJson.images[0].url, providerUsed: 'SiliconFlow 备用算力云' };
            }
          }
        } catch (e) {
          // Fallback
        }
      }

      // 3. Pollinations High Quality Free Pool Failover
      try {
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${resBucket.width}&height=${resBucket.height}&seed=${currentSeed}&nologo=true&enhance=true&safe=${!enableNsfw}&model=flux`;

        const polResponse = await fetchWithRetry(pollinationsUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
          timeoutMs: 35000,
          maxRetries: 3,
        });

        if (polResponse.ok) {
          const arrayBuffer = await polResponse.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          return { url: `data:image/jpeg;base64,${base64}`, providerUsed: 'Pollinations 高清通用算力池 (自动降级补偿)' };
        } else {
          attemptedErrors.push(await parseErrorResponse(polResponse, 'Pollinations 兜底算力挂起'));
        }
      } catch (e: any) {
        attemptedErrors.push(`Pollinations 超时: ${e.message}`);
      }

      throw new Error(attemptedErrors.join(' | ') || '算力节点处理异常，请检查配额或稍后重试');
    };

    // If asyncTask flag is true (for Vercel Hobby 10s protection), create taskId and resolve in background
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (asyncTask) {
      taskStore.set(taskId, { status: 'processing', createdAt: Date.now() });

      // Run background execution
      (async () => {
        try {
          for (let i = 0; i < count; i++) {
            const currentSeed = baseSeed + i * 17;
            const res = await generateSingleWorkerAI(currentSeed);
            if (res?.url) generatedImages.push(res.url);
          }
          if (generatedImages.length > 0) {
            edgeResultCache.set(cacheHash, { imageUrls: generatedImages, timestamp: Date.now() });
            taskStore.set(taskId, {
              status: 'completed',
              result: { imageUrl: generatedImages[0], imageUrls: generatedImages, generationTimeMs: Date.now() - startTime },
              createdAt: Date.now(),
            });
          } else {
            taskStore.set(taskId, { status: 'failed', error: '图像生成未完成', createdAt: Date.now() });
          }
        } catch (err: any) {
          taskStore.set(taskId, { status: 'failed', error: err.message, createdAt: Date.now() });
        }
      })();

      return NextResponse.json({
        success: true,
        async: true,
        data: { taskId, status: 'processing', checkUrl: `/api/task/${taskId}` },
      });
    }

    // Synchronous execution path
    for (let i = 0; i < count; i++) {
      try {
        const currentSeed = baseSeed + i * 17;
        const res = await generateSingleWorkerAI(currentSeed);
        if (res?.url) generatedImages.push(res.url);
      } catch (err: any) {
        if (generatedImages.length === 0 && i === count - 1) {
          return NextResponse.json(
            { success: false, error: err?.message || '图像生成失败，外部算力节点异常' },
            { status: 502 }
          );
        }
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json({ success: false, error: '未能成功生成图像，请稍后重试' }, { status: 500 });
    }

    edgeResultCache.set(cacheHash, { imageUrls: generatedImages, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: generatedImages[0],
        imageUrls: generatedImages,
        generationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '服务器处理生成请求时发生未知异常' },
      { status: 500 }
    );
  }
}
