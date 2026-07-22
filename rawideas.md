Updated `EXPECTA.md` for a **Next.js** stack instead of Express/Node.js. Main changes:

**Architecture**
- Replaced `server/` + `public/` with App Router layout: `app/`, `components/`, `lib/`
- API is now `app/api/scan/[barcode]/route.ts` (Route Handler) instead of Express routes
- Safety data moved to `lib/data/ingredientSafety.json`
- Services moved to `lib/productLookup.ts` and `lib/safetyEngine.ts`

**Stack**
- Next.js 15, React 19, TypeScript, Tailwind CSS
- No separate Express server — one Next.js process handles UI and API

**Running**
- `npm run dev` for development
- `npm run build && npm start` for production

**Frontend**
- Plain HTML/JS replaced with React client components (`BarcodeScanner`, `ModeToggle`, `ScanResults`, etc.)
- `html5-qrcode` as an npm package in a client component, not a CDN script

**Docs additions**
- Example Route Handler in TypeScript
- Component responsibility table
- Updated build status and quick reference

The repo is still on the Express MVP — this doc now describes the **target Next.js architecture**. Want me to migrate the codebase to match it?
