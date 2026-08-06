import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { XMLParser } from "fast-xml-parser";

import { NamecheapCredentials, ProviderTestResult } from "./provider.types";

@Injectable()
export class NamecheapClient {
  private readonly mode: string;
  private readonly apiUrl: string;
  private readonly parser = new XMLParser({ ignoreAttributes: false });

  constructor(config: ConfigService) {
    this.mode = config.get<string>("APP_MODE", "mock");
    this.apiUrl = config.get<string>(
      "NAMECHEAP_API_URL",
      "https://api.sandbox.namecheap.com/xml.response",
    );
  }

  async testCredentials(
    credentials: NamecheapCredentials,
  ): Promise<ProviderTestResult> {
    if (this.mode === "mock") {
      return {
        ok: true,
        provider: "namecheap",
        mode: "mock",
        message: "Mock Namecheap credentials are valid",
        details: { accountBalance: "100.00", currency: "USD" },
      };
    }

    const url = new URL(this.apiUrl);
    url.search = new URLSearchParams({
      ApiUser: credentials.apiUser,
      ApiKey: credentials.apiKey,
      UserName: credentials.username,
      ClientIp: credentials.clientIp,
      Command: "namecheap.users.getBalances",
    }).toString();

    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    const xml = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        provider: "namecheap",
        mode: this.mode,
        message: `Namecheap returned HTTP ${response.status}`,
      };
    }

    const parsed = this.parser.parse(xml) as Record<string, unknown>;
    const apiResponse = parsed.ApiResponse as Record<string, unknown> | undefined;
    const responseStatus = String(apiResponse?.["@_Status"] ?? "ERROR");
    const errors = apiResponse?.Errors as Record<string, unknown> | undefined;
    const rawError = errors?.Error;
    const messages = (Array.isArray(rawError) ? rawError : rawError ? [rawError] : [])
      .map((error) =>
        typeof error === "object" && error !== null
          ? String((error as Record<string, unknown>)["#text"] ?? "Unknown error")
          : String(error),
      )
      .filter(Boolean);

    if (responseStatus !== "OK") {
      return {
        ok: false,
        provider: "namecheap",
        mode: this.mode,
        message: messages.join(", ") || "Namecheap credential test failed",
      };
    }

    return {
      ok: true,
      provider: "namecheap",
      mode: this.mode,
      message: "Namecheap API connection is active",
    };
  }
}
