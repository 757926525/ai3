// High-Precision Chinese-English Prompt Translator & Dictionary Preprocessor
const EXACT_PROMPT_DICT: Record<string, string> = {
  白狐: 'a majestic white fox with fluffy ethereal fur and glowing blue eyes',
  白狐AI: 'mystical white fox, glowing eyes, masterpiece digital painting',
  赛博朋克: 'cyberpunk style, vibrant neon glowing lights, futuristic cityscape background',
  机甲: 'detailed mecha armor, polished metallic surfaces, intricate mechanical parts',
  二次元: 'masterpiece anime key visual, Makoto Shinkai aesthetic, crisp clean line art',
  动漫: 'beautiful anime illustration, vivid rich colors, cinematic composition',
  水墨: 'traditional Chinese ink wash painting, xuan paper texture, elegant poetic brushstrokes',
  国风: 'traditional Chinese style, oriental aesthetic, exquisite hanfu',
  写实: 'photorealistic portrait, raw photo, DSLR shot, 85mm lens, f/1.8 aperture, natural skin texture',
  胶片: '35mm vintage film photograph, Kodak Portra 400, fine grain, nostalgic lighting',
  光影: 'cinematic studio lighting, volumetric shadows, ray tracing reflections',
  肖像: 'masterpiece detailed portrait, crystal clear focus on eyes',
  古风: 'ancient oriental hanfu, elegant flowing silk fabric',
  高清: '8k resolution, hyperdetailed, sharp focus',
  唯美: 'aesthetics art, delicate composition, masterpiece',
  科幻: 'sci-fi futuristic scene, volumetric light, advanced technology',
  插画: 'detailed digital illustration, artistic rendering, masterpiece',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // 1. Direct keyword replacements for Chinese terms
  Object.keys(EXACT_PROMPT_DICT).forEach((key) => {
    if (clean.includes(key)) {
      clean = clean.replaceAll(key, EXACT_PROMPT_DICT[key]);
    }
  });

  // 2. Sanitize syntax
  clean = clean.replace(/[\(\)\[\]]/g, '').trim();

  const qualityBoost = 'masterpiece, best quality, highly detailed, 8k resolution, cinematic lighting, sharp focus';
  return `${clean}, ${qualityBoost}`;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string, nsfwEnabled = false): string {
  const custom = (userNegative || '').trim();
  const builtIn = (defaultNegative || 'blurry, low quality, distorted, bad hands, bad face, deformed, watermark, low resolution').trim();

  const safetyFilter = nsfwEnabled ? '' : ', explicit violence, gore, explicit nudity';

  if (!custom) return `${builtIn}${safetyFilter}`;
  return `${custom}, ${builtIn}${safetyFilter}`;
}
