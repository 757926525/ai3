import { getRequestContext } from '@cloudflare/next-on-pages';

export function getCloudflareEnv(): Record<string, any> {
  let cfEnv: Record<string, any> = {};
  try {
    const ctx = getRequestContext();
    if (ctx && ctx.env) {
      cfEnv = ctx.env;
    }
  } catch {
    // Not running in @cloudflare/next-on-pages context
  }
  return { ...process.env, ...cfEnv };
}
