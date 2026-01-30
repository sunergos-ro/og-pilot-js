const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof btoa === "undefined") {
    throw new Error("btoa is not available in this environment");
  }

  return btoa(binary);
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeString(value: string): string {
  return base64UrlEncodeBytes(encoder.encode(value));
}

function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }

  return null;
}

async function hmacSha256(data: string, secret: string): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();

  if (!subtle) {
    throw new Error("Web Crypto API is not available; requires a Node 18+ or Edge runtime.");
  }

  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await subtle.sign("HMAC", key, encoder.encode(data));
  return new Uint8Array(signature);
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncodeString(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(signingInput, secret);

  return `${signingInput}.${base64UrlEncodeBytes(signature)}`;
}
