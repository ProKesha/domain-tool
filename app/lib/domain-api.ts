export type ProviderAccountApi = {
  id: string;
  provider: "cloudflare" | "namecheap";
  label: string;
  username: string | null;
  apiUser: string | null;
  clientIp: string | null;
  status: "untested" | "active" | "invalid" | "disabled";
  hasSecret: boolean;
};

export type CreateProviderAccountInput = {
  provider: "cloudflare" | "namecheap";
  label: string;
  apiToken?: string;
  apiKey?: string;
  apiUser?: string;
  username?: string;
  clientIp?: string;
};

export type DomainJobType =
  | "cloudflare.setup"
  | "cloudflare.remove"
  | "cloudflare.change_ip"
  | "namecheap.set_ns"
  | "namecheap.set_hosts"
  | "domain.full_reset";

export type DomainJob = {
  id: string;
  type: DomainJobType;
  status: "queued" | "running" | "completed" | "partial" | "failed" | "cancelled";
  totalItems: number;
  completedItems: number;
  failedItems: number;
  items?: Array<{
    domainName: string;
    status: string;
    error?: string | null;
  }>;
};

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_DOMAIN_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:4000/api";
  }
  return null;
}

export function isDomainApiConfigured() {
  return apiBaseUrl() !== null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error("Domain API is not configured");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json()) as T & { message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new Error(message || `Domain API returned HTTP ${response.status}`);
  }
  return body;
}

export function listProviderAccounts() {
  return request<ProviderAccountApi[]>("/accounts");
}

export function createProviderAccount(input: CreateProviderAccountInput) {
  return request<ProviderAccountApi>("/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function testProviderAccount(id: string) {
  return request<{ ok: boolean; message: string }>(`/accounts/${id}/test`, {
    method: "POST",
  });
}

export function deleteProviderAccount(id: string) {
  return request<{ deleted: true; id: string }>(`/accounts/${id}`, {
    method: "DELETE",
  });
}

export async function createAndWaitForJob(input: {
  type: DomainJobType;
  domains: string[];
  options?: {
    targetIp?: string;
    removeFromDatabase?: boolean;
  };
}) {
  let job = await request<DomainJob>("/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const deadline = Date.now() + 30_000;
  while (["queued", "running"].includes(job.status) && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    job = await request<DomainJob>(`/jobs/${job.id}`);
  }
  if (["queued", "running"].includes(job.status)) {
    throw new Error("The operation is still running. Check the job list shortly.");
  }
  if (["failed", "cancelled"].includes(job.status)) {
    throw new Error(job.items?.find((item) => item.error)?.error || "The operation failed");
  }
  return job;
}
