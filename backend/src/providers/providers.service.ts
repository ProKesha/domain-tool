import { Injectable } from "@nestjs/common";

import { CloudflareClient } from "./cloudflare.client";
import { NamecheapClient } from "./namecheap.client";
import { ProviderCredentials } from "./provider.types";

@Injectable()
export class ProvidersService {
  constructor(
    private readonly cloudflare: CloudflareClient,
    private readonly namecheap: NamecheapClient,
  ) {}

  testCredentials(credentials: ProviderCredentials) {
    return credentials.provider === "cloudflare"
      ? this.cloudflare.testCredentials(credentials)
      : this.namecheap.testCredentials(credentials);
  }
}
