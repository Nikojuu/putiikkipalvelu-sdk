# SDK Migration Guide

This guide covers moving the SDK from `verkkokauppapalvelu/packages/sdk` to its own public repository.

## Current State

The SDK is now **standalone** with manually written types:
- No dependency on `openapi-typescript`
- No dependency on OpenAPI spec
- Types are defined in `src/types/index.ts`
- Fully decoupled from the main project

## Step 1: Create Public Repository

1. Create new GitHub repo: `putiikkipalvelu-sdk` (public)

2. Copy SDK files to new repo:
```bash
# From verkkokauppapalvelu directory
cp -r packages/sdk/* /path/to/putiikkipalvelu-sdk/
```

3. Files to copy:
```
putiikkipalvelu-sdk/
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── types/
│   │   └── index.ts          # Manual types
│   ├── resources/
│   │   └── store.ts
│   └── utils/
│       ├── errors.ts
│       └── fetch.ts
├── tests/
│   └── ...
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── README.md
└── .gitignore
```

## Step 2: Update Package Info

Edit `package.json` in the new repo:

```json
{
  "name": "@putiikkipalvelu/storefront-sdk",
  "version": "0.1.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_ORG/putiikkipalvelu-sdk"
  },
  "bugs": {
    "url": "https://github.com/YOUR_ORG/putiikkipalvelu-sdk/issues"
  },
  "homepage": "https://github.com/YOUR_ORG/putiikkipalvelu-sdk#readme"
}
```

## Step 3: Publish to npm

```bash
# In the new SDK repo
npm login
npm publish --access public
```

Or set up GitHub Actions for automated publishing.

## Step 4: Update verkkokauppapalvelu

1. **Install from npm:**
```bash
npm install @putiikkipalvelu/storefront-sdk
```

2. **Remove path alias from tsconfig.json:**
```diff
  "paths": {
    "@/*": ["./src/*"],
-   "@sdk/*": ["./packages/sdk/src/*"]
  }
```

3. **Update imports in API routes:**
```diff
- import type { StoreConfig } from "@sdk/types/index";
+ import type { StoreConfig } from "@putiikkipalvelu/storefront-sdk";
```

4. **Delete the local SDK:**
```bash
rm -rf packages/sdk
```

## Step 5: Update Storefront Template

In `testi-kauppa`:

1. **Remove npm link:**
```bash
npm unlink @putiikkipalvelu/storefront-sdk
```

2. **Install from npm:**
```bash
npm install @putiikkipalvelu/storefront-sdk
```

---

## Ongoing Maintenance

### When Adding New API Endpoints

1. **Update SDK types** (`src/types/index.ts`):
```typescript
export interface NewType {
  id: string;
  // ...
}
```

2. **Add resource method** (if needed):
```typescript
// src/resources/products.ts
async getProduct(slug: string, options?: FetchOptions): Promise<Product> {
  return fetcher.request<Product>(`/product/${slug}`, options);
}
```

3. **Update exports** (`src/index.ts`):
```typescript
export type { NewType } from "./types/index.js";
```

4. **Publish new version:**
```bash
npm version patch  # or minor/major
npm publish
```

5. **Update consumers:**
```bash
# In verkkokauppapalvelu
npm update @putiikkipalvelu/storefront-sdk

# In storefront templates
npm update @putiikkipalvelu/storefront-sdk
```

### Type Sync Discipline

Since types are now manual, remember to:
- Update SDK types when API response shapes change
- Test that SDK types match actual API responses
- Use the same type names in both SDK and API routes

---

## SDK Documentation

For SDK-specific docs, consider:

1. **README.md** - Installation, quick start, basic usage
2. **docs/** folder - Detailed guides per feature
3. **JSDoc comments** - Already in types and methods (shows in IDE)

Example docs structure:
```
docs/
├── getting-started.md
├── store-config.md
├── products.md
├── error-handling.md
└── caching.md
```

You can use GitHub Pages, Docusaurus, or VitePress to host these.
