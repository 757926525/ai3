// High-Precision Chinese-English Prompt Translator & Dictionary Preprocessor
const EXACT_PROMPT_DICT: Record<string, string> = {
  厚涂: 'impasto oil painting style, textured brushstrokes, rich layered pigments',
  赛璐璐: 'anime cel shading style, crisp clean anime line art, vibrant flat colors',
  景深: 'bokeh depth of field, sharp focus on subject, beautifully blurred background',
  '8k': '8k resolution, hyperdetailed, sharp focus',
  '8K': '8k resolution, hyperdetailed, sharp focus',
  莫奈: 'Claude Monet impressionism style, vibrant light reflections, painterly texture',
  毕加索: 'Picasso cubism style, abstract geometric shapes',
  极简: 'minimalist art design, clean elegant composition',
  哑光: 'matte finish, soft diffuse lighting',
  水彩: 'delicate watercolor painting, soft fluid color washes, wet-on-wet technique',
  白狐: 'a majestic white fox with fluffy ethereal fur and glowing blue eyes',
  白狐AI: 'mystical white fox with glowing blue eyes, masterpiece digital painting',
  狐狸: 'a graceful fox with vibrant fur',
  赛博朋克: 'cyberpunk style, vibrant neon glowing lights, futuristic cityscape background',
  机甲: 'detailed mecha armor, polished metallic surfaces, intricate mechanical parts',
  二次元: 'masterpiece anime key visual, Makoto Shinkai aesthetic, crisp clean line art',
  动漫: 'beautiful anime illustration, vivid rich colors, cinematic composition',
  水墨: 'traditional Chinese ink wash painting, xuan paper texture, elegant poetic brushstrokes',
  国风: 'traditional Chinese style, oriental aesthetic, exquisite hanfu',
  汉服: 'exquisite traditional Chinese hanfu silk robes',
  写实: 'photorealistic portrait, raw photo, DSLR shot, 85mm lens, f/1.8 aperture, natural skin texture',
  超写实: 'hyperrealistic masterpiece, highly detailed skin texture, professional camera photography',
  胶片: '35mm vintage film photograph, Kodak Portra 400, fine grain, nostalgic lighting',
  光影: 'cinematic studio lighting, volumetric shadows, ray tracing reflections',
  肖像: 'masterpiece detailed portrait, crystal clear focus on eyes',
  古风: 'ancient oriental aesthetic, elegant flowing silk fabric',
  高清: '8k resolution, hyperdetailed, sharp focus',
  唯美: 'aesthetics art, delicate composition, masterpiece',
  科幻: 'sci-fi futuristic scene, volumetric light, advanced technology',
  插画: 'detailed digital illustration, artistic rendering, masterpiece',
  雪景: 'snowy mountain landscape, falling snowflakes, winter atmosphere',
  星空: 'stunning starry night sky, milky way galaxy, glowing nebula',
  桃花: 'blooming pink peach blossoms, romantic petals falling in wind',
  建筑: 'grand architectural design, majestic buildings',
  近景: 'close-up shot, detailed focus',
  全景: 'panoramic wide angle view, breathtaking scenery',
  特写: 'macro detail close-up, sharp crisp focus',
  光线: 'dramatic lighting, rim light, golden hour glow',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // 1. Direct keyword replacements for Chinese terms & art style vocabulary
  Object.keys(EXACT_PROMPT_DICT).forEach((key) => {
    if (clean.includes(key)) {
      clean = clean.replaceAll(key, EXACT_PROMPT_DICT[key]);
    }
  });

  // 2. Sanitize syntax
  clean = clean.replace(/[\(\)\[\]]/g, '').trim();

  // Avoid duplicating quality boosters if already present
  if (!clean.toLowerCase().includes('masterpiece') && !clean.toLowerCase().includes('8k')) {
    const qualityBoost = 'masterpiece, best quality, highly detailed, 8k resolution, cinematic studio lighting, well-lit, optimal exposure, vibrant color grading, sharp crystal clear focus';
    clean = `${clean}, ${qualityBoost}`;
  }

  return clean;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string, nsfwEnabled = false): string {
  const custom = (userNegative || '').trim();

  if (nsfwEnabled) {
    // When adult content generation is ON, keep negative prompt completely clean without censorship keywords
    return custom || 'blurry, low quality, distorted, dark shadows, underexposed';
  }

  const builtIn = (defaultNegative || 'blurry, low quality, distorted, dark shadows, underexposed, bad hands, bad face, deformed, extra fingers, mutated hands, poorly drawn face, poorly drawn hands, missing limbs, bad anatomy, watermark, text, low resolution').trim();
  const safetyFilter = ', explicit violence, gore, explicit nudity, nsfw';

  if (!custom) return `${builtIn}${safetyFilter}`;
  return `${custom}, ${builtIn}${safetyFilter}`;
}
