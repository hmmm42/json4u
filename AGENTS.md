## 1. Project Overview

- **Name & Purpose**: `json4u` is a Next.js 14 application that provides rich JSON visualization, validation, transformation, and comparison tools (graph view, table view, text diff, JSONPath, jq, CSV import/export, previews, etc.). See `README.md:16` for key feature bullets.
- **Architecture Style**: Modern React/Next.js app using the App Router (`src/app`) with co-located routes, server actions, and middleware. UI is built from reusable components under `src/components` and larger feature "containers" under `src/containers`.
- **Core Domains**:
  - **Editor & Views**: JSON editor, graph, table, comparison, and mode switching logic under `src/containers/editor` and supporting libraries in `src/lib/parser`, `src/lib/graph`, `src/lib/table`, `src/lib/compare`, and `src/lib/worker`.
  - **Preview & Utilities**: Type-aware preview of values (dates, URLs, colors, images, JWT, etc.) via `src/lib/preview` and generic helpers in `src/lib/utils.ts`.
  - **Authentication & User State**: Supabase-backed auth, user session handling, and global client-side stores under `src/lib/supabase`, `src/stores`, and `src/app/login`.
  - **Billing & Subscription**: Lemon Squeezy-powered subscriptions and webhook handling under `src/lib/shop` and `src/app/api/billing/webhook/route.ts:1`.
  - **Internationalization (i18n)**: Locale-aware routing and translations via `next-intl` integration (`src/i18n/request.tsx:1`, `messages/en.json`, `messages/zh.json`).
  - **Monitoring & Error Tracking**: Sentry integration for client, server, and edge runtimes (`next.config.mjs:85`, `sentry.*.config.ts`).
- **Runtime Topology**:
  - **Frontend**: Next.js server-side and client-side rendering, Tailwind-based UI, Monaco editor, React Flow graph, and web workers for heavy JSON processing.
  - **Backend**: Next.js route handlers for billing webhooks and auth callbacks (`src/app/api/**`), plus Supabase as the primary data store (`src/lib/supabase`).
  - **Edge & Middleware**: Next.js middleware for attaching version headers and initializing Supabase auth on every request (`src/middleware.ts:1`).

## 2. Build & Commands

All commands are defined in `package.json:6`.

- **Install**:
  - `pnpm install` – install dependencies (preinstall enforces pnpm via `npx only-allow pnpm`).
- **Development**:
  - `pnpm dev` – run Next.js dev server.
  - Open `http://localhost.json4u.com:3000` as documented in `README.md:75` (local dev assumes host-based routing rather than `localhost:3000`).
- **Build & Run**:
  - `pnpm build` – `next build` using `next.config.mjs` (MDX, next-intl, bundle analyzer, Sentry sourcemaps, env validation).
  - `pnpm start` – `next start` for a production build.
  - `pnpm preview` – `next build && next start`; used as the Playwright webServer command (`playwright.config.ts:54`).
  - `pnpm analyze` – build with bundle analyzer enabled (`ANALYZE=true next build`).
- **Testing & Quality**:
  - `pnpm test` – unit tests with Vitest (`vitest.config.ts:7`).
  - `pnpm bench` – benchmarks via `vitest bench`.
  - `pnpm e2e` – run Playwright end-to-end tests (`playwright.config.ts:1`).
  - `pnpm e2e:ui` – run Playwright tests with UI.
  - `pnpm e2e:gen` – generate Playwright specs from live browsing.
  - `pnpm lint` – run TypeScript (`tsc --noEmit`), `next lint`, and Prettier check (`package.json:18`).
  - `pnpm format` – apply Prettier formatting to the entire repo.
  - `pnpm unused` – detect unused code via `knip`.
  - `pnpm cycle` – detect circular dependencies via `madge`.
- **Supabase Types & Tooling**:
  - `pnpm gentypes` – generate Supabase TypeScript types into `src/lib/supabase/database.types.ts` using `supabase gen` (`package.json:22`).
  - `pnpm lighthouse` – run Lighthouse audit against `http://localhost:3000` (`package.json:23`).
- **Webhook Testing** (see `README.md:83`):
  - Use `@webhooksite/cli` (`whcli forward`) to forward webhook.site events to the local billing webhook endpoint.

## 3. Code Style

### 3.1 TypeScript & Module Layout

- **Strict TypeScript**: `tsconfig.json:2` enables `strict` mode with `noEmit`, modern `es2022` targets, `moduleResolution: "bundler"`, and JSX `preserve` for Next.js.
- **Path Aliases**: `@/*` maps to `./src/*` (`tsconfig.json:22`), and Webpack aliases `@` to the repo root for client bundles (`next.config.mjs:54`). Prefer these aliases for cross-cutting utilities and modules.
- **Library vs UI Separation**:
  - **Pure logic** lives in `src/lib/**` (parsers, graph/table layout, comparison, preview, jq/worker integration, shop/billing, Supabase access, env handling).
  - **Stateful UI** is organized as generic components in `src/components/**` and feature-specific containers under `src/containers/**` (editor, landing, pricing, login).
  - **Routing & Pages** use the Next.js App Router structure inside `src/app/**`, including MDX-based static content under `src/app/(home)/(mdx)`.

### 3.2 Linting Rules

Linting is configured via `.eslintrc.json:1` and `package.json:18`.

- **Base Config**: Extends `next/core-web-vitals` for React/Next best practices.
- **Key Rules**:
  - `unused-imports/no-unused-imports: error` – imports must be cleaned up; rely on this instead of `no-unused-vars` (disabled).
  - `import/no-cycle: warn` – circular imports are reported; `pnpm cycle` can be used to investigate.
  - `no-empty`, `no-multiple-empty-lines`, `no-irregular-whitespace`: enforced as errors.
  - `strict: ["error", "never"]`: disallows manual `'use strict'` directives.
  - `linebreak-style: ["error", "unix"]`: enforces LF line endings.
  - `quotes: ["error", "double", { "avoidEscape": true }]`: prefer double quotes.
  - `prefer-const: error`: prefer `const` over `let` when possible.
  - `react/jsx-no-literals: warn`: encourages avoiding hardcoded string literals directly in JSX; prefer i18n messages or constants.

### 3.3 Formatting (Prettier)

Prettier is configured in `.prettierrc:1`.

- **Core Formatting**:
  - `trailingComma: "all"`, `semi: true`.
  - `singleQuote: false` – match ESLint’s double-quote rule.
  - `printWidth: 120`, `tabWidth: 2`, `arrowParens: "always"`.
- **Import Ordering**:
  - Uses `@trivago/prettier-plugin-sort-imports` with `importOrder` groups: React → Next → third-party → `src/**` → relative modules (`.prettierrc:8`).
  - Keep imports consistent with these groups to avoid churn from `pnpm format`.

### 3.4 Styling & Layout

- **Tailwind CSS**: Configured in `tailwind.config.ts:3`.
  - `darkMode: ["class"]` – theme toggling is class-based.
  - `content` covers `./pages`, `./components`, `./app`, and `./src` to pick up utility classes.
  - Custom CSS variables (e.g., `--hl-key`, `--parse-error`) are surfaced as Tailwind color tokens (`tailwind.config.ts:38`).
  - Animation utilities such as `accordion-down`/`accordion-up` are defined for UI components (`tailwind.config.ts:92`).
- **UI Components**: Many UI primitives are in `src/components/ui/**`, aligned with Radix UI patterns (accordion, dialog, dropdown, tabs, etc.). Prefer reusing these primitives when extending the UI.

## 4. Testing

### 4.1 Unit & Integration Tests (Vitest)

- **Config**: `vitest.config.ts:7` defines:
  - Plugins: `tsconfigPaths()` (honors TS path aliases), `@vitejs/plugin-react`, and `unplugin-auto-import` for Vitest globals.
  - `test.environment: "happy-dom"` for browser-like DOM APIs (`vitest.config.ts:17`).
  - `include: ["__tests__/*.{test,spec}.?(c|m)[jt]s?(x)"]` ensures tests live under `__tests__/`.
  - `includeSource: ["src/**/*.{js,ts,tsx}"]` for coverage and watcher behavior.
  - `env` is hydrated using `loadEnv` (`vitest.config.ts:21`), so `.env` files affect tests similarly to dev builds.
- **Conventions**:
  - Place tests under `__tests__/` with `.test.ts` or `.test.tsx` suffixes.
  - Existing tests cover color parsing, date handling, JSON formatting/parsing, comparison, layout, JSONPath, URL-to-JSON, and table logic.
  - Tests typically interact with pure modules in `src/lib/**` rather than page components.
- **Running**:
  - `pnpm test` – run the full Vitest suite.
  - `pnpm bench` – execute benchmark suites declared in `__tests__/format.bench.ts` and similar files.

### 4.2 End-to-End Tests (Playwright)

- **Config**: `playwright.config.ts:1`.
  - `testDir: "./e2e/tests"` – all E2E specs live in `e2e/tests/**`. Helpers are under `e2e/helpers`.
  - `fullyParallel: true`, `retries: 1`, and `workers` tuned for CI vs local dev.
  - `reporter: "html"` – generates an HTML report.
  - `use.baseURL: "http://localhost:3000"` with `trace: "retain-on-failure"`.
  - `webServer` uses `pnpm preview` and waits up to 10 minutes (`playwright.config.ts:54`).
- **Running**:
  - `pnpm e2e` – headless E2E suite.
  - `pnpm e2e:ui` – interactive UI mode for debugging.
  - `pnpm e2e:gen` – codegen that records interactions into a new spec file.

### 4.3 Testing Guidance

- Prefer testing pure logic in `src/lib/**` (parsers, diff algorithms, table/grid layout, etc.) via Vitest.
- Use Playwright specs to cover cross-cutting flows such as editing JSON, toggling views, comparing documents, and subscription UX.
- Before running E2E tests, ensure environment variables required by `next.config.mjs` and `src/lib/env.ts` are set, since env validation runs at build time.

## 5. Security

### 5.1 Environment Validation & Secrets

- Environment variables are centrally validated via `@t3-oss/env-nextjs` in `src/lib/env.ts:34`.
  - **Server-only** secrets: `LEMONSQUEEZY_SUBSCRIPTION_VARIANT_MAP`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_API_KEY`, `SUPABASE_KEY` (`src/lib/env.ts:35`).
  - **Client-exposed** vars: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_FREE_QUOTA`, `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` (`src/lib/env.ts:42`).
  - `stringToJSONSchema` ensures structured JSON env values are valid (`src/lib/env.ts:24`).
- Build startup (in `next.config.mjs:13`) imports `src/lib/env` via `jiti` to validate envs during `next build`.
- **Guideline**: Add new env vars to `src/lib/env.ts` instead of using `process.env` directly.

### 5.2 Authentication & Session Handling

- Supabase is used for auth and storage:
  - Middleware (`src/middleware.ts:5`) attaches a `x-json4u-version` header and initializes a Supabase client for every matched request using `createServerClient` with cookies from the request.
  - The Supabase server client (`src/lib/supabase/server.ts:15`) reads/syncs cookies via Next’s `cookies()` API and uses the `SUPABASE_KEY` secret for privileged operations.
  - `Db.getAuthenticatedUser()` asserts that authenticated operations have a logged-in user with an email (`src/lib/supabase/server.ts:47`).
  - Session cookies are set via Supabase’s SSR helpers; middleware ensures compatibility by recreating a `NextResponse` whenever cookies change (`src/middleware.ts:15`).

### 5.3 Billing Webhook Verification

- The Lemon Squeezy webhook handler resides at `src/app/api/billing/webhook/route.ts:1`.
  - Per-request, it reads `X-Event-Name` and `User-Agent`, then buffers the raw request body (`route.ts:10-18`).
  - It computes an HMAC using `env.LEMONSQUEEZY_WEBHOOK_SECRET` and compares it with `X-Signature` using `crypto.timingSafeEqual` (`route.ts:21-29`).
  - Invalid signatures or missing bodies yield a `400` response with logging; parsing errors yield `400` with an error description.
  - The payload is validated using a Zod schema in `src/lib/shop/webhookRequest.ts:18` and associated types (`src/lib/shop/types.ts`).
  - On success, it upserts an `Order` into the `orders` table in Supabase via `Db.upsertOrder` and logs results (`route.ts:59-82`).
  - Plan resolution is based on `env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_MAP` (`route.ts:85-99`).
- **Guideline**: Reuse the Zod-based validation model (parse + schema + safeParse) when adding or extending API endpoints.

### 5.4 Error Tracking & Privacy

- Sentry is initialized across runtimes:
  - **Client**: `sentry.client.config.ts:7` sets DSN, ignores known noisy errors, sets `release` to the app version, and enables Session Replay with `maskAllText: true` and `blockAllMedia: true` to reduce PII exposure.
  - **Server**: `sentry.server.config.ts:7` tracks server-side errors with full traces but no replay.
  - **Edge**: `sentry.edge.config.ts:8` covers middleware and other edge features.
- Sentry’s Next.js integration is wired through `withSentryConfig` in `next.config.mjs:85`, including:
  - Conditional sourcemap upload controlled by `SENTRY_AUTH_TOKEN` (`next.config.mjs:83`).
  - An `ignore` list that excludes tests, public assets, and config from uploads (`next.config.mjs:101`).
  - Disabled telemetry and logger to reduce noise.

### 5.5 Frontend Security Considerations

- WebAssembly support for jq is loaded under `public/jq/1.7` and used via `src/lib/jq`. Webpack is configured to emit WASM into `static/wasm/[modulehash].wasm` (`next.config.mjs:56`).
- Environment-derived URLs (`NEXT_PUBLIC_APP_URL`, Supabase URLs) are validated via regex in `src/lib/env.ts:43`, reducing risk from misconfigured hosts.
- UI components rely on Radix primitives and Tailwind; no direct DOM manipulation libraries are in use.

## 6. Configuration

### 6.1 Next.js Configuration

- Located in `next.config.mjs:20`.
  - `reactStrictMode: true`, `swcMinify: true`, `poweredByHeader: false` (removes `X-Powered-By` header).
  - `output: "standalone"` when `NEXT_PUBLIC_APP_URL` points to `.cn` domains (`next.config.mjs:16-18`), enabling smaller deployment artifacts for that environment.
  - `pageExtensions` includes `md`/`mdx` to support documentation routes.
  - `experimental.serverActions.allowedOrigins` restricts which origins can issue server actions (`next.config.mjs:29`).
  - `experimental.optimizePackageImports` optimizes runtime imports for many heavy libraries (`next.config.mjs:32`).
  - Custom `webpack` function sets `fs` fallback to `false` in the client bundle and adds `@` aliasing, plus a `DefinePlugin` to configure Sentry/rrweb flags (`next.config.mjs:49-67`).

### 6.2 Tailwind & Styling

- `tailwind.config.ts` defines theme-level spacing, colors, radius, animations, and safelist entries for syntax-highlighting classes.
- Global styles and CSS variables live in `src/app/globals.css` and are consumed by Tailwind utilities.

### 6.3 Internationalization (next-intl)

- `next-intl` is wired via `createNextIntlPlugin` in `next.config.mjs:75` using `./src/i18n/request.tsx`.
- Translation message catalogs live in `messages/en.json` and `messages/zh.json`.
- Routes under `src/app/(home)/(mdx)` serve localized MDX content for changelog, tutorial, privacy, and terms pages.

### 6.4 Supabase & Database

- Supabase connection configuration and typed DB access are under `src/lib/supabase/**`.
  - `src/lib/supabase/client.ts` – browser-side Supabase client using anon key.
  - `src/lib/supabase/server.ts:15` – server-side Supabase client using `SUPABASE_KEY` with cookie-based session handling.
  - `src/lib/supabase/database.types.ts` – generated types (keep in sync using `pnpm gentypes`).
  - `src/lib/supabase/table.types.ts` – local TypeScript definitions for high-level entities like `Order`.

### 6.5 Billing & Plans

- Billing configuration is concentrated in `src/lib/shop/**`:
  - `base.ts`, `subscription.ts`, `subscriptionItem.ts`, `subscriptionInvoice.ts` – Zod schemas around Lemon Squeezy entities.
  - `types.ts` – shared types and enums like `SubscriptionType`.
  - `webhookRequest.ts:18` – Zod schema for webhook payloads (used by `src/app/api/billing/webhook/route.ts`).
- Environment-based mapping between product variants and subscription tiers comes from `LEMONSQUEEZY_SUBSCRIPTION_VARIANT_MAP` in `src/lib/env.ts:35`.

### 6.6 Testing & Tooling Configuration

- **Vitest**: `vitest.config.ts` – unit test runner config.
- **Playwright**: `playwright.config.ts` – E2E runner config, including `webServer` and per-browser projects.
- **ESLint**: `.eslintrc.json` – linting rules and plugins.
- **Prettier**: `.prettierrc` – formatting rules and import sorting.
- **Tailwind**: `tailwind.config.ts` – utility-first styling.

---

This overview is intended as a starting point for agents and contributors to navigate the project quickly. When implementing new features, align with the existing separation between `src/lib` (logic), `src/components` (reusable UI), `src/containers` (feature flows), and `src/app` (routing and server concerns), and reuse the existing env validation, Supabase access patterns, and testing setup.

