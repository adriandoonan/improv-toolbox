# Improv Toolbox

Improv Toolbox is a mobile-first Progressive Web App (PWA) for improv teachers and players. It provides timers, suggestions, and a pocket database of exercises, forms, and warmups, all optimized for quick use on phones and tablets.

## Features

- **Main Navigation Drawer**: Unified navigation for all categories and tools.
- **Landing Page**: Quick links to Exercises, Forms, Warmups, and Tools.
- **Tools**:
  - **Timer**: Simple countdown timer with wake lock and visual cues.
  - **Gauss Timer**: Scene timer using the Gauss summation formula for decreasing scene lengths.
- **Exercises, Forms, Warmups**: Easily browsable and filterable lists (coming soon).
- **PWA**: Installable, offline-capable, and touch-friendly.

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Build for production:
   ```sh
   npm run build
   ```
4. Preview your build:
   ```sh
   npm run preview
   ```

## Project Structure

- `public/` — Static assets, icons, and styles
- `src/components/` — Reusable UI components (e.g., Drawer)
- `src/layouts/` — Main layout files
- `src/pages/` — All routes, including tools, exercises, forms, and warmups

## Tech Stack

- [Astro](https://astro.build/) — Static site generator
- [Pico.css](https://picocss.com/) — Minimal CSS framework
- Plain JavaScript for all interactivity

## Author

Adrian Doonan

---

For more details, see the code and explore the app!
