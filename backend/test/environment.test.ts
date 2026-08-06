import assert from "node:assert/strict";
import test from "node:test";

import { validateEnvironment } from "../src/config/environment";

test("environment defaults to a safe local mock mode", () => {
  const config = validateEnvironment({});

  assert.equal(config.APP_MODE, "mock");
  assert.equal(config.DATABASE_ENABLED, false);
  assert.equal(config.REDIS_ENABLED, false);
  assert.equal(config.PORT, 4000);
});

test("live mode rejects the development encryption key", () => {
  assert.throws(
    () => validateEnvironment({ APP_MODE: "live" }),
    /development ENCRYPTION_KEY/,
  );
});
