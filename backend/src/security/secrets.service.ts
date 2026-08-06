import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

@Injectable()
export class SecretsService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    this.key = Buffer.from(config.getOrThrow<string>("ENCRYPTION_KEY"), "hex");
  }

  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
  }

  decrypt(payload: string) {
    const [version, ivValue, tagValue, encryptedValue] = payload.split(":");
    if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
      throw new Error("Unsupported encrypted secret format");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}
