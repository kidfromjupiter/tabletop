This repository is an Expo + React Native app (created with `create-expo-app`) using the Expo Router file-based routing.

Key facts for an AI coding assistant working in this repo
- Start development: `npm install` then `npx expo start` (also available as `npm run start`).
- Platform targets: Android, iOS, and Web. Use `npm run android`, `npm run ios`, or `npm run web` to open a platform directly.
- The app entry points and routes live under the `app/` directory. File-based routing is used (see `app/_layout.tsx` and `app/(tabs)/_layout.tsx`).
- Small UI primitives and patterns are in `components/` (for example `components/hello-wave.tsx`, `components/themed-text.tsx`, `components/themed-view.tsx`). Respect these themed components when adding screens.
- Shared constants and simple helpers live under `constants/` and `hooks/`.
- The project uses Expo packages and relies on `expo-router`, `react-native-reanimated`, and `@expo/vector-icons`. Prefer these project dependencies for new UI and animation work.
- There is a helper script `scripts/reset-project.js` exposed as `npm run reset-project` that will move example code to `app-example/` and scaffold a blank `app/` directory — avoid running it unless you intend to wipe the current example screens.

Project-specific conventions and patterns
- Routing: Add pages under `app/` to create routes. Nested folders (like `(tabs)`) configure route groups — check existing `app/(tabs)/index.tsx` and `app/(tabs)/explore.tsx` for examples.
- Theming: Use `components/themed-view.tsx` and `components/themed-text.tsx` for color-aware UI. Colors are centralized in `constants/theme.ts`.
- UI/animation: This repo demonstrates playful animations with `react-native-reanimated` via `components/hello-wave.tsx`. When adding animations, follow the small helper patterns used there (worklets + simplified props).
- File edits: Prefer TypeScript (`.tsx`) and maintain the project's existing import style and naming (PascalCase components, kebab/flat filenames for routes).
- Styling: Inline style objects appear frequently in example screens for quick prototypes. For shared styles, add exported style objects inside the component file or create small shared files under `components/ui/` (e.g., `components/ui/collapsible.tsx`).

Developer workflows (quick commands)
- Install deps: `npm install` (repo uses pnpm lock but npm is documented in README)
- Start dev server: `npx expo start` or `npm run start`
- Platform quick open: `npm run android`, `npm run ios`, `npm run web`
- Lint: `npm run lint`
- Reset example app (destructive or move to `app-example/`): `npm run reset-project`

What to avoid
- Do not run `npm run reset-project` unless you want the example code moved to `app-example/`.
- Avoid introducing native modules that require custom native builds without adding clear upgrade notes — this is an Expo-managed template tuned for standard Expo packages.

Quick examples for the assistant
- To add a new screen route: create `app/newgame.tsx` exporting a default React component. Use `ThemedView` + `ThemedText` for visuals.
- To use animations consistent with the project: mirror `components/hello-wave.tsx` (use `react-native-reanimated` worklets and simple props for duration/looping).
- To add a shared UI helper: create a new file under `components/ui/` and export small, focused components (see `components/ui/collapsible.tsx`).

Files to inspect first
- `app/_layout.tsx` and `app/(tabs)/_layout.tsx` — router/layout patterns
- `package.json` — npm scripts
- `components/` — UI primitives and patterns
- `constants/theme.ts` — color tokens and font names
- `scripts/reset-project.js` — dangerous script; read before running

If anything is ambiguous, ask for which platform (web/ios/android) or whether native modules are permitted.

End of instructions.
