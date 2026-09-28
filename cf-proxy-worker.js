/**
 * Cloudflare Worker Reverse Proxy for 白狐AI三 (Fox AI 3)
 * Use this worker to proxy traffic, inject headers, or bypass region restrictions.
 */

const TARGET_UPSTREAM = "https://your-baihu-ai-app.vercel.app"; // Replace with your upstream app URL or origin IP

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `${TARGET_UPSTREAM}${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", url.hostname);
    headers.set("X-Real-IP", request.headers.get("cf-connecting-ip") || "");

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: "follow",
    });

    try {
      const response = await fetch(modifiedRequest);
      const responseHeaders = new Headers(response.headers);

      // Inject CORS and Security Headers
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("X-Proxied-By", "Cloudflare-Worker-Proxy");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Cloudflare Proxy Error", message: error.message }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
