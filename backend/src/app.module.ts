import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AccountsModule } from "./accounts/accounts.module";
import { validateEnvironment } from "./config/environment";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { JobsModule } from "./jobs/jobs.module";
import { ProvidersModule } from "./providers/providers.module";
import { SecurityModule } from "./security/security.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    SecurityModule,
    ProvidersModule,
    AccountsModule,
    JobsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
