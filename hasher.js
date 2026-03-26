import crypto from "crypto";

export function hash(content) {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex");
}