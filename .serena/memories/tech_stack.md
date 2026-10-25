# Tech stack
- React 19 with JSX and native ES modules.
- Vite 8 with `@vitejs/plugin-react`; relative base and hash routing support static hosting.
- Node.js >=20.19; npm lockfile is authoritative.
- Tests use Node's built-in test runner; UI validation uses Playwright already installed as a dev dependency.
- Supabase JS powers authenticated accounts, account profiles, and direct messages; workspace data remains mock/local.