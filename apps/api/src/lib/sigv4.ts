import { createHash, createHmac } from "node:crypto";

/**
 * AWS Signature V4 tối giản (không cần @aws-sdk) – đủ cho PUT/DELETE object lên S3 / Cloudflare R2.
 * Tham chiếu: https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html
 */
export type SignInput = {
  method: string;
  host: string;
  /** Đã URI-encode, bắt đầu bằng "/" */
  path: string;
  query?: string;
  headers: Record<string, string>;
  payloadHash: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
  /** YYYYMMDD'T'HHMMSS'Z' */
  amzDate: string;
};

export const sha256Hex = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const hmac = (key: string | Buffer, data: string) => createHmac("sha256", key).update(data).digest();

export function amzDateOf(d = new Date()): string {
  return d.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/** Trả về header Authorization */
export function signV4(i: SignInput): string {
  const date = i.amzDate.slice(0, 8);
  const all: Record<string, string> = { host: i.host, "x-amz-date": i.amzDate };
  for (const [k, v] of Object.entries(i.headers)) all[k.toLowerCase()] = v.trim().replace(/\s+/g, " ");
  const names = Object.keys(all).sort();
  const canonicalHeaders = names.map((n) => `${n}:${all[n]}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = [i.method, i.path, i.query ?? "", canonicalHeaders, signedHeaders, i.payloadHash].join("\n");
  const scope = `${date}/${i.region}/${i.service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", i.amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${i.secretAccessKey}`, date);
  const kSigning = hmac(hmac(hmac(kDate, i.region), i.service), "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  return `AWS4-HMAC-SHA256 Credential=${i.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}
