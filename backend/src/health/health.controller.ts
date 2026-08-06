import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { DatabaseService } from "../database/database.service";
import { JobsService } from "../jobs/jobs.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
    private readonly jobs: JobsService,
  ) {}

  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "domain-tool-backend",
      mode: this.config.get<string>("APP_MODE", "mock"),
      database: this.database.status,
      queue: this.jobs.status,
      timestamp: new Date().toISOString(),
    };
  }
}
