import { Module } from "@nestjs/common";

import { ProvidersModule } from "../providers/providers.module";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";

@Module({
  imports: [ProvidersModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
