import { Module } from "@nestjs/common";

import { CloudflareClient } from "./cloudflare.client";
import { NamecheapClient } from "./namecheap.client";
import { ProvidersService } from "./providers.service";

@Module({
  providers: [CloudflareClient, NamecheapClient, ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
