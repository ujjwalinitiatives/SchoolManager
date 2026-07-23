import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function encryptionKey() {
  const encodedKey = process.env.GATEWAY_ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error("GATEWAY_ENCRYPTION_KEY must be configured before saving payment gateway credentials.");
  }

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) {
    throw new Error("GATEWAY_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }

  return key;
}

/** Encrypts a credential using AES-256-GCM for safe application-level storage. */
export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

/** Available for server-side payment verification work; never send encrypted values to the client. */
export function decryptSecret(value: string) {
  const [version, iv, authTag, encrypted, ...extra] = value.split(":");
  if (version !== VERSION || !iv || !authTag || !encrypted || extra.length > 0) {
    throw new Error("Invalid encrypted credential format.");
  }

  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}
