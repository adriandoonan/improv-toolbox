# Improv Toolbox — Requirements

_Last updated: 2025-10-16_

## 1. Project Purpose

Improv Toolbox provides information and interactive tools for improv performers and trainers.  
It is designed for use during practice, coaching sessions, and shows, with a mobile-first, offline-capable PWA.

Lesson planning, personal notes, and scheduling enhancements continue to evolve as we collect feedback from facilitators.

---

## 2. Tech Stack and Conventions

- **Framework:** Astro, preferring content collections
- **UI Components:** Web components; Svelte components preferred where they are the best fit
- **Deployment:** Cloudflare
- **App Style:** PWA, local-first, mobile-first
- **Programming style:** Functional-first — shared logic should be pure/side-effect free; imperative glue for UI and platform APIs is acceptable when needed
- **Content storage:** Markdown files with named fields in front matter
- **Extensibility:** Tools are discrete components; collaborators can add a tool if the front matter is correct and the tool works

---

## 3. Core Content Sections

All content sections (warmups, exercises, forms, tools) share the same **base feature set**:

- **List view**: searchable, filterable, sortable
- **Detail page**:
  - Core fields (name, description, tags, etc.)
  - Ability to favourite elements via the [FavoriteToggle component](../src/components/FavoriteToggle.astro)
  - If relevant, embed matching tools (e.g. timers, suggestion generators)
  - Optional trainer notes, variations, related elements
  - Personal notes stored locally in Markdown through the [NotesPanel component](../src/components/NotesPanel.astro)
- **Submission**: users can submit new elements for the database

### 3.0 Implementation Status (MVP vs. backlog)

- **Delivered (alpha):**
  - Global drawer navigation covering Home, Exercises, Forms, Warmups, and Tools.
  - Static content collections with list filtering, detail pages, favourites, and tool embeds for exercises, warmups, and forms (see [exercises index](../src/pages/exercises/index.astro)).
  - Personal notes saved per item with offline storage handled by [NotesPanel](../src/components/NotesPanel.astro).
  - Tools directory with Timer, Gauss Timer, Jam Groupaliser, Suggestion Generator, and the [Lesson Planner](../src/pages/tools/lesson-plans/index.astro).
- **In progress:** Enhancing forms-specific filters and deep-link coverage for suggestion APIs.
- **Planned (backlog):** User submissions, advanced search, cross-device sync, and scheduling workflows.

### 3.1 Warmups

- Fields: name, short & long descriptions, minimum participants, focus, step-by-step
- Optional:
  - Trainer notes (things to watch out for)
  - Variations (e.g. “Five Things” with categories or characters)
  - Related warmups
  - Timers (if time-based)
  - Suggestions (if suggestion-based)
- Tags and focus (e.g. agreement, group mind, character work, object work)

### 3.2 Exercises

- Same base features as warmups
- Can embed timers or suggestion tools (e.g. emotions, seven deadly sins)
- Fields: name, purpose (single keyword), shortDescription, description, optional focus, tags array, source, credit, optional minimumPeople.
- Purpose captures the primary skill in one word so filtering remains lightweight; tags contain the broader context (categories, focus areas).
- Source and credit identify where the exercise originated (e.g. `cliffweb` with credit `unclaimed` for imported material) to simplify future attribution updates.
- Filters allow sorting by focus, source, credit, minimum participants, and favourites.

### 3.3 Forms

- Same base features
- Can embed form-specific timers (e.g. Gauss form timer)

### 3.4 Tools

- Discrete interactive components
- Can be embedded into detail pages of warmups, exercises, or forms

---

## 4. Tools

### 4.1 Timers

All timers:

- Prevent phone sleep while active
- Remain active until user interaction or one minute after finishing
- Must document verification steps (manual or automated) demonstrating wake-lock, overtime behaviour, and fullscreen fallbacks for each variant.

Types:

- Standard timer
- Gauss timer
- Looping timer
- Custom interval timer (e.g. Harold, Deconstruction timing)

### 4.2 Suggestions

- Default: word suggestion
- Configurable sets (e.g. emotions, locations, song lyrics, seven deadly sins)

---

## 5. Future Features

- **Session Planner automations**: Build on the Lesson Planner with time budgeting, suggested flows, and constraint validation.
- **Scheduling**: Calendar-based planning and reminders.
- **Cross-device sync**: Optional account-based syncing for favourites, notes, and lesson plans.
- **Community submissions**: Intake flow for facilitators to share exercises and tools.

---

## 6. Non-Functional Requirements

- **Performance**: Optimized for mobile, low bandwidth, and offline use
  - The service worker pre-caches the app shell, theme stylesheet, and hashed Astro bundles so the UI and styling remain available offline after installation.
- **Usability**: Clean UI with minimal distractions
- **Standalone home**: Installed PWA sessions open directly to the content categories; marketing hero/highlights/CTA are hidden
  so facilitators can jump straight into resources.
- **Accessibility**: WCAG AA compliance where possible
- **Extensibility**: Easy for contributors to add new tools/content by following front matter schema

---

## 7. Testing & Quality

- **Static build verification**: `npm test` performs an Astro production build and inspects generated HTML for navigation, category previews, tool listings, and exercise filters.
- **Manual QA**: Continue spot-checking interactive tool behaviour (timers, suggestion feeds) on modern mobile browsers after significant UI or content updates.

---

## Change Log

- **2025-10-16:** Documented the streamlined standalone home experience for installed devices.
- **2025-10-14:** Added single-word `purpose`, `tags`, `source`, and `credit` requirements for exercises and captured Cliffweb import metadata expectations.
- **2025-10-12:** Documented delivered favourites, personal notes, and Lesson Planner functionality; refreshed future roadmap items.
- **2025-10-05:** Captured alpha scope (navigation, content collections, tools) and documented automated HTML regression tests.
- **2025-10-02:** Clarified functional programming expectations, documented feature delivery phases, added timer validation requirement, created Architecture/API doc stubs.
