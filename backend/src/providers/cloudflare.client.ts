import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CloudflareCredentials, ProviderTestResult } from "./provider.types";

type CloudflareResponse<T> = {
  success: boolean;
  result?: T;
  errors?: Array<{ code?: number; message?: string }>;
};

@Injectable()
export class CloudflareClient {
  private readonly mode: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.mode = config.get<string>("APP_MODE", "mock");
    this.baseUrl = config.get<string>(
      "CLOUDFLARE_API_URL",
      "https://api.cloudflare.com/client/v4",
    );
  }

  async testCredentials(
    credentials: CloudflareCredentials,
  ): Promise<ProviderTestResult> {
    if (this.mode === "mock") {
      return {
        ok: true,
        provider: "cloudflare",
        mode: "mock",
        message: "Mock Cloudflare token is valid",
        details: { tokenStatus: "active" },
      };
    }

    const response = await fetch(`${this.baseUrl}/user/tokens/verify`, {
      headers: { Authorization: `Bearer ${credentials.apiToken}` },
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await response.json()) as CloudflareResponse<{
      id: string;
      status: string;
    }>;
    if (!response.ok || !body.success || !body.result) {
      return {
        ok: false,
        provider: "cloudflare",
        mode: this.mode,
        message:
          body.errors?.map((error) => error.message).filter(Boolean).join(", ") ||
          `Cloudflare returned HTTP ${response.status}`,
      };
    }

    return {
      ok: body.result.status === "active",
      provider: "cloudflare",
      mode: this.mode,
      message: `Cloudflare token status: ${body.result.status}`,
      details: { tokenId: body.result.id, tokenStatus: body.result.status },
    };
  }
}
