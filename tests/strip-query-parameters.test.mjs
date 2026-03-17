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
