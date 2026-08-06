export type ProviderName = "namecheap" | "cloudflare";

export type NamecheapCredentials = {
  provider: "namecheap";
  apiUser: string;
  username: string;
  apiKey: string;
  clientIp: string;
};

export type CloudflareCredentials = {
  provider: "cloudflare";
  apiToken: string;
  accountId?: string;
};

export type ProviderCredentials = NamecheapCredentials | CloudflareCredentials;

export type ProviderTestResult = {
  ok: boolean;
  provider: ProviderName;
  mode: string;
  message: string;
  details?: Record<string, unknown>;
};
