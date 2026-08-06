import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateJobDto } from "./dto/create-job.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list() {
    return this.jobs.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.jobs.get(id);
  }

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobs.create(dto);
  }
}
