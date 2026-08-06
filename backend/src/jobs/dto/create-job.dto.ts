import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIP,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from "class-validator";

export enum JobDtoType {
  CloudflareSetup = "cloudflare.setup",
  CloudflareRemove = "cloudflare.remove",
  CloudflareChangeIp = "cloudflare.change_ip",
  NamecheapSetNs = "namecheap.set_ns",
  NamecheapSetHosts = "namecheap.set_hosts",
  DomainFullReset = "domain.full_reset",
}

export class JobOptionsDto {
  @IsOptional()
  @IsUUID()
  cloudflareAccountId?: string;

  @IsOptional()
  @IsUUID()
  namecheapAccountId?: string;

  @IsOptional()
  @IsIP(4)
  targetIp?: string;

  @IsOptional()
  @IsBoolean()
  removeFromDatabase?: boolean;
}

export class CreateJobDto {
  @IsEnum(JobDtoType)
  type!: JobDtoType;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @Matches(/^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i, {
    each: true,
    message: "each domain must be a valid DNS name",
  })
  domains!: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => JobOptionsDto)
  options?: JobOptionsDto;
}
