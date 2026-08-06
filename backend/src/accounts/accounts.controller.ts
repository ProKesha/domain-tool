import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";

import { AccountsService } from "./accounts.service";
import { CreateProviderAccountDto } from "./dto/create-provider-account.dto";

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list() {
    return this.accounts.list();
  }

  @Post()
  create(@Body() dto: CreateProviderAccountDto) {
    return this.accounts.create(dto);
  }

  @Post(":id/test")
  test(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.accounts.test(id);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.accounts.remove(id);
  }
}
