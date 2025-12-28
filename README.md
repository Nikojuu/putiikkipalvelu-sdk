# @putiikkipalvelu/storefront-sdk

> **Alpha (0.x)**: API may change between versions

TypeScript SDK for building headless storefronts with Putiikkipalvelu.

## Installation

```bash
npm install @putiikkipalvelu/storefront-sdk
```

## Quick Start

```typescript
import { createStorefrontClient } from '@putiikkipalvelu/storefront-sdk';

const storefront = createStorefrontClient({
  apiKey: process.env.STOREFRONT_API_KEY!,
  baseUrl: 'https://putiikkipalvelu.fi/api/storefront/v1',
});

// Get store configuration
const config = await storefront.store.getConfig();
console.log(config.store.name);
```

## Next.js Integration

```typescript
// lib/storefront.ts
import { createStorefrontClient } from '@putiikkipalvelu/storefront-sdk';

export const storefront = createStorefrontClient({
  apiKey: process.env.STOREFRONT_API_KEY!,
  baseUrl: process.env.NEXT_PUBLIC_STOREFRONT_API_URL!,
});
```

### With Caching

```typescript
const config = await storefront.store.getConfig({
  next: { revalidate: 300, tags: ['store-config'] }
});
```

## Error Handling

```typescript
import {
  createStorefrontClient,
  AuthError,
  NotFoundError,
  StorefrontError
} from '@putiikkipalvelu/storefront-sdk';

try {
  const config = await storefront.store.getConfig();
} catch (error) {
  if (error instanceof AuthError) {
    // Invalid API key
  } else if (error instanceof NotFoundError) {
    // Resource not found
  } else if (error instanceof StorefrontError) {
    // Other API error
    console.error(error.code, error.message);
  }
}
```

## TypeScript

All types are exported for use in your application:

```typescript
import type {
  StoreConfig,
  StoreInfo,
  Product,
  Campaign
} from '@putiikkipalvelu/storefront-sdk';
```

## Available Resources

- `store.getConfig()` - Store configuration, SEO, payments, campaigns

More resources coming soon.

## License

MIT
