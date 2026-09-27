import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || 'flux';

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Query HuggingFace Inference Open Models
    const hfUrl = `https://huggingface.co/api/models?search=${encodeURIComponent(query.trim())}&filter=text-to-image&sort=downloads&direction=-1&limit=15`;
    const res = await fetchWithRetry(hfUrl, { timeoutMs: 10000, maxRetries: 1 });

    if (res.ok) {
      const modelsData = await res.json();
      const formatted = (modelsData || []).map((m: any) => ({
        id: m.id || m.modelId,
        name: (m.id || m.modelId).split('/').pop() || m.id,
        translatedName: (m.id || m.modelId).split('/').pop() || m.id,
        description: `全网开源文生图模型 (${m.downloads || 1000}+ 下载量)`,
        posterUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent((m.id || m.modelId).split('/').pop())}%20artwork?width=300&height=300&nologo=true`,
        provider: 'huggingface',
        category: 'flux',
        isFree: true,
      }));

      return NextResponse.json({ success: true, data: formatted });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
