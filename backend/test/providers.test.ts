import { ConfigService } from "@nestjs/config";
import assert from "node:assert/strict";
import test from "node:test";

import { CloudflareClient } from "../src/providers/cloudflare.client";
import { NamecheapClient } from "../src/providers/namecheap.client";

const config = new ConfigService({ APP_MODE: "mock" });

test("Cloudflare credential check is safely simulated in mock mode", async () => {
  const result = await new CloudflareClient(config).testCredentials({
    provider: "cloudflare",
    apiToken: "mock-cloudflare-token",
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(result.provider, "cloudflare");
});

test("Namecheap credential check is safely simulated in mock mode", async () => {
  const result = await new NamecheapClient(config).testCredentials({
    provider: "namecheap",
    apiKey: "mock-namecheap-key",
    apiUser: "demo-api-user",
    username: "demo-user",
    clientIp: "192.0.2.50",
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(result.provider, "namecheap");
});
