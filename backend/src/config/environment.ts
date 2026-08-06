type AppMode = "mock" | "sandbox" | "live";

function booleanValue(value: unknown, fallback: boolean) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

export function validateEnvironment(source: Record<string, unknown>) {
  const appMode = String(source.APP_MODE ?? "mock") as AppMode;
  if (!["mock", "sandbox", "live"].includes(appMode)) {
    throw new Error("APP_MODE must be mock, sandbox, or live");
  }

  const encryptionKey = String(
    source.ENCRYPTION_KEY ??
      "0000000000000000000000000000000000000000000000000000000000000001",
  );
  if (!/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
    throw new Error("ENCRYPTION_KEY must contain exactly 64 hexadecimal characters");
  }
  if (appMode === "live" && /^0{63}1$/.test(encryptionKey)) {
    throw new Error("The development ENCRYPTION_KEY cannot be used in live mode");
  }

  return {
    ...source,
    NODE_ENV: String(source.NODE_ENV ?? "development"),
    APP_MODE: appMode,
    PORT: Number(source.PORT ?? 4000),
    CORS_ORIGIN: String(source.CORS_ORIGIN ?? "http://localhost:3000"),
    DATABASE_ENABLED: booleanValue(source.DATABASE_ENABLED, false),
    DATABASE_URL: String(
      source.DATABASE_URL ??
        "postgresql://domain_tool:domain_tool_dev@localhost:5433/domain_tool",
    ),
    REDIS_ENABLED: booleanValue(source.REDIS_ENABLED, false),
    REDIS_URL: String(source.REDIS_URL ?? "redis://localhost:6380"),
    ENCRYPTION_KEY: encryptionKey,
    NAMECHEAP_API_URL: String(
      source.NAMECHEAP_API_URL ?? "https://api.sandbox.namecheap.com/xml.response",
    ),
    CLOUDFLARE_API_URL: String(
      source.CLOUDFLARE_API_URL ?? "https://api.cloudflare.com/client/v4",
    ),
  };
}
