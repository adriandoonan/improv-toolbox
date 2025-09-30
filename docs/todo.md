# Todo & Refactor Backlog

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
