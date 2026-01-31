<!-- .github/copilot-instructions.md - concise, repo-specific guidance for AI coding agents -->

# Copilot instructions — frontend

Purpose: give AI coding agents the minimum, actionable knowledge to be productive in this Vite + React + TypeScript + Tailwind repo.

- Quick commands
  - Install: `npm install`
  - Dev (local): `npm run dev` (Vite on port 5173)
  - Build: `npm run build`
  - Preview production build: `npm run preview`
  - Docker (dev): `docker compose up --build` (service maps host 9017 -> container 5173)

- High-level architecture
  - Single-page React app using Vite. Entry: `src/main.tsx` -> `src/App.tsx`.
  - Router definitions live under `src/router/` (example: `src/router/index.tsx`).
  - Feature modules are intended to live under `src/features/` (domain folders with pages/components).
  - Reusable UI components in `src/components/`, layout components in `src/layouts/`, and app state under `src/store/`.
  - Styling with Tailwind; configuration: `tailwind.config.ts` and global CSS at `src/index.css`.

- Project-specific conventions and gotchas
  - TypeScript: `strict: true`, `jsx: react-jsx`, and `noEmit: true` in `tsconfig.json`; run the dev server to validate type/JSX behavior.
  - Tailwind: source globs include `./src/**/*.{ts,tsx}` — keep JSX/TSX files in `src/` to be scanned.
  - Vite server: configured in `vite.config.ts` with `host: '0.0.0.0'` and `port: 5173` (dev container friendly).
  - Docker/dev: `Dockerfile` runs `npm run dev`. `docker-compose.yml` mounts the workspace into `/app` and sets `CHOKIDAR_USEPOLLING=true` for file-watch reliability.

- Imports and path aliases
  - You'll see one import pattern in the router: `import Login from "@/features/auth/pages/Login"` (see `src/router/index.tsx`).
  - There is NO `paths` or `baseUrl` configured in `tsconfig.json` and no `resolve.alias` in `vite.config.ts` in the current tree. Treat `@/` imports as placeholders — prefer relative imports until an explicit alias is added.

- Examples to reference quickly
  - App entry: `src/main.tsx` creates the React root and mounts `src/App.tsx`.
  - Router example: `src/router/index.tsx` (uses `react-router-dom` `createBrowserRouter`).
  - Tailwind setup: `tailwind.config.ts` and `src/index.css`.
  - Container/dev mapping: `docker-compose.yml` (host port `9017` -> container `5173`).

- External dependencies and environment
  - Core deps: `react`, `react-dom`, `lucide-react`.
  - Dev tooling: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `postcss`.
  - No backend integration discovered in this workspace snapshot — verify runtime environment or environment variables before implementing network calls.

- What AI agents should do first (short checklist)
  1. Run `npm install` then `npm run dev` locally to verify the dev server and watch behavior.
  2. Inspect `src/features/` before adding feature imports; the folder is currently empty in this snapshot.
 3. When you see `@/` imports, search repo for an alias config; if none exists, convert to relative imports or propose adding an alias and update both `vite.config.ts` and `tsconfig.json`.

If any of these sections look incomplete or you want more examples (e.g., a suggested `vite` alias snippet or a recommended `tsconfig.paths` change), tell me which part to expand. 
