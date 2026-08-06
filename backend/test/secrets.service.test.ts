import { ConfigService } from "@nestjs/config";
import assert from "node:assert/strict";
import test from "node:test";

import { SecretsService } from "../src/security/secrets.service";

const key = "17".repeat(32);

test("secrets are encrypted with authenticated random nonces", () => {
  const service = new SecretsService(new ConfigService({ ENCRYPTION_KEY: key }));
  const plainText = "synthetic-test-token";
  const first = service.encrypt(plainText);
  const second = service.encrypt(plainText);

  assert.notEqual(first, plainText);
  assert.notEqual(first, second);
  assert.equal(service.decrypt(first), plainText);
  assert.equal(service.decrypt(second), plainText);
});

test("tampered encrypted payloads cannot be decrypted", () => {
  const service = new SecretsService(new ConfigService({ ENCRYPTION_KEY: key }));
  const encrypted = service.encrypt("synthetic-test-token");
  const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("a") ? "b" : "a"}`;

  assert.throws(() => service.decrypt(tampered));
});
