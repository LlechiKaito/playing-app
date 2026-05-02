import { createHash } from "node:crypto";

export function computeImageHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}
