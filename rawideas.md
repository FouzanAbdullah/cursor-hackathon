# Expecta — Complete Project Documentation
Built for the **Cursor Hackathon**.
Expecta is a pregnancy and nursing product safety scanner. A pregnant or nursing mother asks "is this safe?" a dozen times a day — a medicine, a food label, a skincare bottle. The answer lives in clinical databases and studies; her access runs through Google, forums, and dated blog posts. Expecta scans a product's barcode, pulls its real ingredient list, and returns a clear pregnancy/nursing verdict with the reasoning behind it — at the shelf, instead of an hour of conflicting search results later.
**This is a hackathon demo.** The safety dataset is hand-curated and non-exhaustive. This is not medical advice — always consult a healthcare provider.
---
## Table of Contents
1. [The Problem](#the-problem)
2. [Product Vision — Finn, the AI Comfort Companion](#product-vision--finn-the-ai-comfort-companion)
3. [How It Works](#how-it-works)
4. [Architecture](#architecture)
5. [Running the Project](#running-the-project)
6. [API Reference](#api-reference)
7. [Safety Engine Logic](#safety-engine-logic)
8. [Data Sources](#data-sources)
9. [Current Frontend (MVP)](#current-frontend-mvp)
10. [Planned Frontend — Finn State Machine](#planned-frontend--finn-state-machine)
11. [Limitations](#limitations)
12. [Build Status & Roadmap](#build-status--roadmap)
---
## The Problem
Every day, pregnant and nursing mothers face the same high-stress question: *Is this safe?*
- Product labels are dense and use unfamiliar chemical names.
- Google returns conflicting forum posts, outdated blog articles, and panic-driven comment threads.
- Clinical safety data exists, but it is not accessible at the point of decision — standing in a store aisle with a product in hand.
Expecta closes that gap by turning a barcode scan into an immediate, reasoned safety verdict.
---
## Product Vision — Finn, the AI Comfort Companion
Instead of a standard, static mechanical gauge, the visual centerpiece of Expecta is a fully animated, responsive AI Emoji Face character named **Finn**.
Finn shifts his expressions, animations, and color tones based on the raw safety data returned from the Multimodal LLM. He takes on the persona of a soothing, deeply reassuring, yet witty and direct best friend who handles high-stress moments with perfect calm and a dash of humor.
```
       [ CHILL GREEN ]             [ CAUTION YELLOW ]             [ PANIC RED ]
          ( ^ _ ^ )                     ( • _ • )                 ( ๑ 😰 ๑ )
     "We are so golden."          "Hold on, let's look."     "Step away from bottle!"
```
Finn is the emotional layer on top of the safety engine. The backend returns structured verdict data; Finn translates that into a human, calming experience that reduces anxiety instead of amplifying it.
---
## How It Works
### Current Flow (MVP — Implemented)
1. **Scan or enter a barcode** — use the device camera (html5-qrcode) or type a barcode manually.
2. **Product lookup** — the backend queries [Open Food Facts](https://openfoodfacts.org), an open product database, and retrieves the product name, brand, image, and ingredient list.
3. **Ingredient matching** — each ingredient is matched against a curated safety dataset (`server/data/ingredientSafety.json`):
   - First by Open Food Facts' canonical ingredient id (e.g. `en:retinol` → `retinol`).
   - Then by name/alias matching against ingredient text.
4. **Verdict aggregation** — matched ingredients each carry a pregnancy verdict and a nursing verdict (they can differ) plus a one-line reason. The overall verdict for the product is the worst of its matched ingredients:
   **Avoid > Caution > Safe**
   If nothing in the product matches the dataset, the verdict is **Unknown** — we never default an unmatched ingredient to "safe."
5. **Results display** — the frontend renders the product card, overall verdict badge, and a list of flagged ingredients with per-ingredient reasons.
### Planned Flow (Finn + Multimodal LLM)
1. Same barcode scan and ingredient lookup pipeline.
2. Safety engine returns structured verdict data.
3. A Multimodal LLM layer interprets the verdict context (including trimester, forum-myth detection, and swap recommendations).
4. Finn's frontend state machine selects the appropriate persona, animation, and witty reply text.
5. UI presents Finn alongside actionable next steps (e.g. "Smart Swap" alternative products).
---
## Architecture
```
cursor-hackathon/
├── server/
│   ├── index.js                   Express app, serves /public, mounts API routes
│   ├── routes/scan.js             GET /api/scan/:barcode
│   ├── services/
│   │   ├── productLookup.js       Open Food Facts client
│   │   └── safetyEngine.js        Ingredient matching + verdict aggregation
│   └── data/
│       └── ingredientSafety.json  Curated pregnancy/nursing safety dataset (68 ingredients)
├── public/
│   ├── index.html                 Scan UI (camera + manual entry)
│   ├── app.js                     Camera scan, API calls, result rendering
│   └── style.css                  Styling
├── idea.md                        Finn persona & state machine design spec
├── README.md                      Quick-start project overview
├── EXPECTA.md                     This file — complete project documentation
└── package.json
```
**Stack:** Plain HTML/JS/CSS frontend, no build step — served as static files by a small Express backend. Single dependency: `express ^4.19.2`.
---
## Running the Project
```bash
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000).
- Use the camera scanner or type a barcode manually.
- Try `3017620422003` (Nutella) — flags palm oil.
- Toggle between **Pregnancy** and **Nursing** mode to see mode-specific verdicts.
---
## API Reference
### `GET /api/scan/:barcode`
Look up a product by barcode and return safety evaluation.
**Barcode validation:** 6–14 digits. Returns `400` for invalid format.
#### Response — Product Found
```json
{
  "found": true,
  "product": {
    "name": "Nutella",
    "brand": "Nutella, Ferrero, Yum yum",
    "image": "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.879.400.jpg"
  },
  "overall": {
    "pregnancy": "safe",
    "nursing": "safe"
  },
  "flagged": [
    {
      "ingredient": "palm-oil",
      "matchedText": "huile de palme",
      "pregnancy": {
        "verdict": "safe",
        "reason": "A common food fat with no specific pregnancy safety concern beyond general nutrition."
      },
      "nursing": {
        "verdict": "safe",
        "reason": "No specific nursing safety concern."
      }
    }
  ]
}
```
#### Response — Product Not Found
```json
{
  "found": false
}
```
#### Verdict Values
| Verdict   | Meaning |
|-----------|---------|
| `safe`    | No specific concern identified in the dataset |
| `caution` | Use with moderation or under specific conditions |
