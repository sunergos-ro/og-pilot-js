# OG Pilot JS

> [!IMPORTANT]  
> An active [OG Pilot](https://ogpilot.com?ref=og-pilot-js) subscription is required to use this package.

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

### Template helpers

`createImage` defaults to the `page` template when `template` is omitted.

Use these helpers to force a specific template:

- `createBlogPostImage(...)`
- `createPodcastImage(...)`
- `createProductImage(...)`
- `createEventImage(...)`
- `createBookImage(...)`
- `createCompanyImage(...)`
- `createPortfolioImage(...)`

```ts
import { createBlogPostImage } from "og-pilot-js";

const imageUrl = await createBlogPostImage({
  title: "How to Build Amazing OG Images",
  author_name: "Jane Smith",
  publish_date: "2024-01-15"
});
```

## Parameters

All parameters are embedded in the signed JWT payload; the only query param is `token`.
The library handles `iss` (domain) and `sub` (API key prefix) automatically.

### Core parameters

| Parameter     | Required | Default  | Description                                                   |
|---------------|----------|----------|---------------------------------------------------------------|
| `template`    | No       | `"page"` | Template name                                                 |
| `title`       | Yes      | —        | Primary title text                                            |
| `description` | No       | —        | Subtitle or supporting text                                   |
| `logo_url`    | No       | —        | Logo image URL                                                |
| `image_url`   | No       | —        | Hero image URL                                                |
| `bg_color`    | No       | —        | Background color (hex format)                                 |
| `text_color`  | No       | —        | Text color (hex format)                                       |
| `iat`         | No       | —        | Issued-at timestamp for daily cache busting                   |
| `path`        | No       | auto-set | Request path for image rendering context (see [Path handling](#path-handling)) |

### Options

| Option    | Default | Description                                                              |
|-----------|---------|--------------------------------------------------------------------------|
| `json`    | `false` | When `true`, sends `Accept: application/json` and parses the JSON response |
| `headers` | —       | Additional HTTP headers to include with the request                      |
| `default` | `false` | Forces `path` to `/` when `true`, unless a manual `path` is provided     |

## Path handling

The `path` parameter enhances OG Pilot analytics by tracking which OG images perform better across different pages on your site. By capturing the request path, you get granular insights into click-through rates and engagement for each OG image.

The client automatically injects a `path` parameter on every request:

| Option           | Behavior                                                                                                |
|------------------|---------------------------------------------------------------------------------------------------------|
| `default: false` | Uses the current request path when available (via request context), then falls back to env vars, then `/` |
| `default: true`  | Forces the `path` parameter to `/`, regardless of the current request (unless `path` is provided explicitly) |
| `path: "/..."`   | Uses the provided path verbatim (normalized to start with `/`), overriding auto-resolution              |

### Framework Integration

#### Next.js (App Router)

In Next.js, the recommended approach is to use `generateMetadata` and build the
path directly from `params` and `searchParams` (no middleware needed):

```ts
// app/products/[id]/page.tsx
import type { Metadata } from "next";
import { buildPathFromNextProps, createImage } from "og-pilot-js";

export async function generateMetadata(props): Promise<Metadata> {
  const path = await buildPathFromNextProps("/products/[id]", props);
  const imageUrl = await createImage(
    {
      template: "product",
      title: "Product page",
    },
    { path }
  );

  return {
    openGraph: {
      images: [imageUrl],
    },
  };
}
```

For catch-all routes:

```ts
// app/blog/[...slug]/page.tsx
import { buildPathFromNextProps } from "og-pilot-js";

export async function generateMetadata(props) {
  const path = await buildPathFromNextProps("/blog/[...slug]", props);
  // => /blog/2024/launch?ref=twitter
}
```

#### Express

```ts
import express from "express";
import { createExpressMiddleware } from "og-pilot-js";

const app = express();
app.use(createExpressMiddleware());

// Now path is automatically captured in all routes
app.get("/blog/:slug", async (req, res) => {
  const imageUrl = await createImage({
    template: "blog_post",
    title: "My Blog Post",
  });
  // path is automatically set to /blog/:slug
});
```

#### Nuxt (useSeoMeta)

Nuxt recommends `useSeoMeta` for SEO tags. You can generate the OG image URL
server-side and pass it directly:

```vue
<!-- app/pages/products/[id].vue -->
<script setup lang="ts">
import { createImage } from "og-pilot-js";

const route = useRoute();

if (import.meta.server) {
  const imageUrl = await createImage(
    {
      template: "product",
      title: "Product page",
    },
    { path: route.fullPath }
  );

  useSeoMeta({
    title: "Product page",
    ogTitle: "Product page",
    ogImage: imageUrl,
    twitterCard: "summary_large_image",
  });
}
</script>
```

If you need reactive metadata, pass a computed getter:

```vue
<script setup lang="ts">
const title = ref("My title");

useSeoMeta({
  title,
  ogTitle: () => title.value,
});
</script>
```

#### Other Frameworks

For SvelteKit, Remix, or other frameworks, use `withRequestContext` in your server middleware:

```ts
// SvelteKit hooks (src/hooks.server.ts)
import { setCurrentRequest } from "og-pilot-js";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  setCurrentRequest({ url: event.url.pathname + event.url.search });
  return resolve(event);
};
```

#### Using withRequestContext (async-safe)

For fine-grained control or when middleware isn't suitable:

```ts
import { withRequestContext, createImage } from "og-pilot-js";

// In your request handler
await withRequestContext({ url: req.originalUrl }, async () => {
  const imageUrl = await createImage({
    template: "blog_post",
    title: "My Blog Post"
  });
  // path is automatically set to req.originalUrl
});
```

### Manual path override

```ts
const imageUrl = await createImage({
  template: "page",
  title: "Hello OG Pilot",
  path: "/pricing?plan=pro"
});
```

### Default path

```ts
const imageUrl = await createImage(
  {
    template: "blog_post",
    title: "Default OG Image"
  },
  { default: true }
);
// path is set to "/"
```

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
