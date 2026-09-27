// Multi-Language Prompt Fidelity Preprocessor
const DICT_PROMPT_FIXES: Record<string, string> = {
  白狐: 'a majestic white fox with glowing blue eyes and fluffy ethereal fur',
  白狐AI: 'mystical white fox, glowing eyes, masterpiece artwork',
  赛博朋克: 'cyberpunk style, neon lights, futuristic city background, highly detailed',
  机甲: 'detailed mecha armor, metallic reflections, intricate machinery',
  二次元: 'masterpiece anime key visual, Makoto Shinkai style, vibrant vivid colors',
  动漫: 'beautiful anime illustration, crisp line art, cinematic composition',
  水墨: 'traditional Chinese ink wash painting, xuan paper texture, elegant brushstrokes',
  国风: 'traditional Chinese style, oriental aesthetic, exquisite ancient hanfu',
  写实: 'photorealistic portrait, raw photo, DSLR shot, 85mm lens, f/1.8 aperture, natural skin texture',
  胶片: '35mm vintage film photograph, Kodak Portra 400, fine grain',
  光影: 'cinematic studio lighting, volumetric shadows, ray tracing reflections',
  肖像: 'masterpiece portrait, sharp focus on eyes, 8k resolution',
  古风: 'ancient oriental hanfu, elegant flowing silk fabric',
  高清: '8k resolution, hyperdetailed, sharp focus',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // Direct keyword replacements for Chinese terms
  Object.keys(DICT_PROMPT_FIXES).forEach((key) => {
    if (clean.includes(key)) {
      clean = clean.replaceAll(key, DICT_PROMPT_FIXES[key]);
    }
  });

  // Sanitize broken syntax
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
