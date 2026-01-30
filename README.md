# OG Pilot JS

A small JavaScript/TypeScript client for generating OG Pilot Open Graph images via signed JWTs.

## Installation

```bash
npm install og-pilot-js
```

## Configuration

The default client reads from `OG_PILOT_API_KEY` and `OG_PILOT_DOMAIN`.
You can override them at runtime:

```ts
import { configure } from "og-pilot-js";

configure((config) => {
  config.apiKey = process.env.OG_PILOT_API_KEY;
  config.domain = process.env.OG_PILOT_DOMAIN;
  // Optional overrides:
  // config.openTimeoutMs = 5000;
  // config.readTimeoutMs = 10000;
});
```

## Usage

Generate an image URL (follows the redirect returned by OG Pilot):

```ts
import { createImage } from "og-pilot-js";

const imageUrl = await createImage({
  template: "blog_post",
  title: "How to Build Amazing OG Images",
  description: "A complete guide to social media previews",
  bg_color: "#1a1a1a",
  text_color: "#ffffff",
  author_name: "Jane Smith",
  publish_date: "2024-01-15"
}, {
  iat: Date.now() // optional; refresh cache daily
});
```

If you omit `iat`, OG Pilot will cache the image indefinitely. Provide an `iat`
to refresh the cache daily. You can pass a `Date`, epoch seconds, or epoch
milliseconds (`Date.now()` is auto-converted).

Fetch JSON metadata instead:

```ts
import { createImage } from "og-pilot-js";

const data = await createImage(
  {
    template: "page",
    title: "Hello OG Pilot"
  },
  { json: true }
);
```

## Framework notes

This library is meant for server-side usage. Keep your API key private and do not
call it from client-side/browser code. In Next.js or Nuxt, call it from API routes
or server handlers.

## Advanced usage

Create a dedicated client with custom configuration:

```ts
import { createClient } from "og-pilot-js";

const ogPilot = createClient({
  apiKey: process.env.OG_PILOT_API_KEY,
  domain: process.env.OG_PILOT_DOMAIN
});

const url = await ogPilot.createImage({ title: "Hello" });
```

## Development

```bash
npm run build
npm run typecheck
```
