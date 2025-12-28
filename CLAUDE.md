# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript SDK for building headless storefronts with Putiikkipalvelu. Currently in alpha (0.x) - API may change between versions.

## Commands

```bash
npm run build        # Build with tsup (outputs ESM + CJS + types to dist/)
npm run dev          # Watch mode for development
npm run test         # Run tests once with vitest
npm run test:watch   # Run tests in watch mode
npm run typecheck    # TypeScript type checking only
```

Run a single test file:
```bash
npx vitest run tests/client.test.ts
```

## Architecture

### Core Structure

- **`src/client.ts`** - Main entry point. `createStorefrontClient()` factory creates the SDK client with resource instances.
- **`src/resources/`** - API resource modules. Each resource (e.g., `store.ts`) exports a factory function that receives a `Fetcher` and returns methods for that resource.
- **`src/utils/fetch.ts`** - `createFetcher()` handles all HTTP requests, authentication (x-api-key header), timeout, and error mapping.
- **`src/utils/errors.ts`** - Error class hierarchy: `StorefrontError` base class with specific subclasses (`AuthError`, `RateLimitError`, `NotFoundError`, `ValidationError`).
- **`src/types/`** - TypeScript type definitions. `storeconfig.ts` contains domain types; `index.ts` contains SDK configuration types.

### Adding New Resources

1. Create resource file in `src/resources/` following `store.ts` pattern
2. Export factory function that takes `Fetcher` and returns resource methods
3. Add resource to `StorefrontClient` interface in `client.ts`
4. Instantiate resource in `createStorefrontClient()`
5. Export types from `src/types/index.ts` and `src/index.ts`

### Key Patterns

- Factory functions over classes for tree-shaking
- All API methods accept `FetchOptions` for framework-specific options (Next.js `next: { revalidate }`, etc.)
- Fetcher spreads unknown options to fetch for framework compatibility
- Types kept in sync with API - update `src/types/` when API changes
