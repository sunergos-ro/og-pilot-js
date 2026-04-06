import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "../dist/index.js";

function decodeJwtPayload(token) {
  const [, payload] = token.split(".");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

test("strip query parameters when enabled", async () => {
  const requests = [];

  const client = new Client({
    apiKey: "test_api_key_12345678",
    domain: "example.com",
    stripQueryParameters: true,
    fetch: async (input) => {
      requests.push({ input });

      return {
        status: 200,
        url: "https://cdn.ogpilot.com/generated.png",
        headers: new Headers(),
        async text() {
          return "";
        },
      };
    },
  });

  await client.createImage({
    title: "Strip query test",
    path: "/docs?ref=main",
  });

  assert.equal(requests.length, 1);

  const requestUrl = new URL(String(requests[0].input));
  const token = requestUrl.searchParams.get("token");

  assert.ok(token, "expected signed token query param");
  assert.equal(decodeJwtPayload(token).path, "/docs");
});

test("passes image delivery options through the signed payload", async () => {
  const requests = [];

  const client = new Client({
    apiKey: "test_api_key_12345678",
    domain: "example.com",
    fetch: async (input) => {
      requests.push({ input });

      return {
        status: 200,
        url: "https://cdn.ogpilot.com/generated.webp",
        headers: new Headers(),
        async text() {
          return "";
        },
      };
    },
  });

  await client.createImage({
    title: "Delivery options test",
    template: "page",
    image_type: "webp",
    quality: 82,
    max_bytes: 220000,
  });

  const requestUrl = new URL(String(requests[0].input));
  const token = requestUrl.searchParams.get("token");

  assert.ok(token, "expected signed token query param");

  const payload = decodeJwtPayload(token);
  assert.equal(payload.image_type, "webp");
  assert.equal(payload.quality, 82);
  assert.equal(payload.max_bytes, 220000);
});

test("applies configured image delivery defaults to the signed payload", async () => {
  const requests = [];

  const client = new Client({
    apiKey: "test_api_key_12345678",
    domain: "example.com",
    imageType: "webp",
    quality: 82,
    maxBytes: 220000,
    fetch: async (input) => {
      requests.push({ input });

      return {
        status: 200,
        url: "https://cdn.ogpilot.com/generated.webp",
        headers: new Headers(),
        async text() {
          return "";
        },
      };
    },
  });

  await client.createImage({
    title: "Configured delivery defaults test",
    template: "page",
  });

  const requestUrl = new URL(String(requests[0].input));
  const token = requestUrl.searchParams.get("token");

  assert.ok(token, "expected signed token query param");

  const payload = decodeJwtPayload(token);
  assert.equal(payload.image_type, "webp");
  assert.equal(payload.quality, 82);
  assert.equal(payload.max_bytes, 220000);
});

test("prefers explicit delivery options over configured defaults", async () => {
  const requests = [];

  const client = new Client({
    apiKey: "test_api_key_12345678",
    domain: "example.com",
    imageType: "webp",
    quality: 82,
    maxBytes: 220000,
    fetch: async (input) => {
      requests.push({ input });

      return {
        status: 200,
        url: "https://cdn.ogpilot.com/generated.png",
        headers: new Headers(),
        async text() {
          return "";
        },
      };
    },
  });

  await client.createImage({
    title: "Explicit delivery overrides test",
    template: "page",
    image_type: "png",
    quality: 65,
    max_bytes: 180000,
  });

  const requestUrl = new URL(String(requests[0].input));
  const token = requestUrl.searchParams.get("token");

  assert.ok(token, "expected signed token query param");

  const payload = decodeJwtPayload(token);
  assert.equal(payload.image_type, "png");
  assert.equal(payload.quality, 65);
  assert.equal(payload.max_bytes, 180000);
});
