import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Domain Tool workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Domain Tool — Namecheap \+ Cloudflare<\/title>/i);
  assert.match(html, />Domain Tool</);
  assert.match(html, /Synthetic demo data/);
  assert.match(html, /<strong>200<\/strong> domains loaded/);
  assert.match(html, /alpha-landing\.example/);
  assert.match(html, /NC Bulk Check/);
});

test("frontend source is wired to the local API without real account data", async () => {
  const [page, apiClient] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/domain-api.ts", import.meta.url), "utf8"),
  ]);

  assert.match(apiClient, /NEXT_PUBLIC_DOMAIN_API_URL/);
  assert.match(apiClient, /http:\/\/localhost:4000\/api/);
  assert.match(page, /createAndWaitForJob/);
  assert.match(page, /DOMAINS_PER_PAGE = 50/);
  assert.match(page, /Array\.from\(\{ length: 191 \}/);

  const combined = `${page}\n${apiClient}`;
  assert.doesNotMatch(combined, /91\.199\.|45\.140\.|AK146|rosicatosheva|phamvanhung/i);
});
