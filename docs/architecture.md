# Improv Toolbox — Architecture (Draft)

_Last updated: 2025-10-02_

## Purpose

Describe how the PWA is put together so contributors can navigate the project, extend it without surprises, and understand deployment constraints.

## Status

- **Owner:** Adrian Doonan
- **Completion target:** v1.0 doc pass
- **Current state:** Outline only; needs component diagrams and data flow details.

## Outline

1. **Runtime overview** — Astro islands strategy, hydration boundaries, and how Svelte embeds fit in.
2. **Content pipeline** — content collections, front matter schemas, and build-time transforms.
3. **Interactive tools** — structure for timers/suggestions, shared utilities, wake-lock handling.
4. **Routing & navigation** — sitemap, dynamic routes (e.g., `/exercises/[slug]`), and filter drawers.
5. **PWA layer** — service worker, offline assets, caching strategy, wake-lock considerations.
6. **Deployment** — Cloudflare Pages workflow, environment variables, secrets management.
7. **Observability** — planned logging/analytics (TBD).

## Build & Test Tooling

- **Astro build step**: `npm run build` outputs static HTML under `dist/` and prepares Cloudflare adapter bundles.
- **Regression tests**: `npm test` orchestrates a production build, then runs Node's test runner against generated HTML to assert navigation structure, featured categories, tools catalog entries, and exercise filter metadata.
- **Artifacts**: Tests intentionally avoid network calls and third-party services; HTML snapshots are pulled from the local `dist/` directory for deterministic coverage.

## Next Steps

- Flesh out sections 1–5 with diagrams and code references.
- Document current caching behaviour in the service worker.
- Capture open questions (e.g., auth, user data storage) in a dedicated appendix.

