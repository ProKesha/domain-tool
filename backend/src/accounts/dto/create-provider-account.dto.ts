import { IsEnum, IsIP, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export enum ProviderDtoType {
  Namecheap = "namecheap",
  Cloudflare = "cloudflare",
}

export class CreateProviderAccountDto {
  @IsEnum(ProviderDtoType)
  provider: ProviderDtoType;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  apiUser?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountId?: string;

  @IsOptional()
  @IsIP(4)
  clientIp?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  apiToken?: string;
}
