import crypto from "node:crypto";

export function hashToBytes32(value: unknown) {
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  return `0x${crypto.createHash("sha256").update(payload).digest("hex")}`;
}
