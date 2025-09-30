# Todo & Refactor Backlog

## Tasks

### Backfill interaction coverage for resource filters

- Add automated browser tests that exercise the fuzzy search, structured filters, and favourites-only toggle across exercises, warmups, and forms.
- Capture baseline expectations for ranking so future tweaks to the fuzzy weights stay intentional.

### Evaluate swapping custom fuzzy index for Fuse.js

- Now that the listings rely on a homegrown `FuzzyIndex`, audit bundle impact and browser support before replacing it with the upstream Fuse.js package once dependency installs are available.

### Polish Cliffweb exercise import formatting

- Review generated descriptions for edge cases where HTML lists or emphasis lost fidelity.
- Capture any manual corrections needed so the Python importer can be iterated instead of hand-editing.

### Inline shortcut icon once bespoke asset ready

- Generate a dedicated 96×96 shortcut icon and embed it as a base64 `data:` URL in `public/manifest.webmanifest` so the PWA can expose tailor-made artwork without adding new binary assets to the repo.

## Refactor opportunities

### Modularize NotesPanel data and rendering helpers

- **Context:** `src/components/NotesPanel.astro` currently couples storage, migration, markdown conversion, and UI wiring within a single inline script, increasing complexity and making testing difficult.
- **Next steps:**
  - Extract storage (versioning, migrations, persistence) into a pure utility such as `src/utils/notesStorage.ts` with accompanying unit tests.
  - Move markdown rendering helpers into a dedicated module (e.g., `src/utils/notesMarkdown.ts`) to allow isolated verification and reuse.
  - Keep the Astro component focused on UI orchestration by importing the new helpers and delegating side effects.

### Decouple Lesson Planner state management and persistence

- **Context:** `src/pages/tools/lesson-plans/index.astro` intermixes IndexedDB access, domain modeling, and DOM manipulation, making the feature hard to reason about and extend.
- **Next steps:**
  - Introduce a storage module under `src/utils/lesson-plans/` to encapsulate IndexedDB operations and error handling.
  - Add pure domain/state helpers that normalize notebooks and plans, keeping impure work at the edges.
  - Update the page component to consume these helpers, leaving it responsible only for event wiring and rendering.
  - Back up the new utilities with targeted tests and document any remaining manual QA steps.

## Documentation follow-ups

- Ensure any future feature work includes README and requirements updates alongside code changes.
- Note additional refactor ideas here as they surface so that subsequent contributors can plan their iterations.
