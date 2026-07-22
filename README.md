# Expecta — Pregnancy & Nursing Product Safety Scanner

Built for the Cursor Hackathon.

## The problem

A pregnant or nursing mother asks "is this safe?" a dozen times a day — a medicine, a
food label, a skincare bottle. The answer lives in clinical databases and studies; her
access runs through Google, forums, and dated blog posts. Expecta scans a product's
barcode, pulls its real ingredient list, and returns a clear pregnancy/nursing verdict
with the reasoning behind it — at the shelf, instead of an hour of conflicting search
results later.

**This is a hackathon demo.** The safety dataset is hand-curated and non-exhaustive.
This is not medical advice — always consult a healthcare provider.

## How it works

1. Scan a barcode (camera) or type one in manually.
2. The backend looks the product up on [Open Food Facts](https://openfoodfacts.org),
   an open product database, and gets back its ingredient list.
3. Each ingredient is matched against a curated safety dataset
   (`server/data/ingredientSafety.json`) — first by Open Food Facts' canonical
   ingredient id (e.g. `en:retinol`), then by name/alias matching.
4. Matched ingredients each carry a pregnancy verdict and a nursing verdict (they can
   differ) plus a one-line reason. The overall verdict for the product is the worst of
   its matched ingredients: **Avoid > Caution > Safe**. If nothing in the product
   matches the dataset, the verdict is **Unknown** — we never default an unmatched
   ingredient to "safe."

## Architecture

```
cursor-hackathon/
├── server/
│   ├── index.js                   Express app, serves /public, mounts API routes
│   ├── routes/scan.js             GET /api/scan/:barcode
│   ├── services/productLookup.js  Open Food Facts client
│   ├── services/safetyEngine.js   ingredient matching + verdict aggregation
│   └── data/ingredientSafety.json curated pregnancy/nursing safety dataset
└── public/
    ├── index.html                 scan UI (camera + manual entry)
    ├── app.js                     camera scan (html5-qrcode), API calls, rendering
    └── style.css
```

Plain HTML/JS/CSS frontend, no build step — served as static files by a small
Express backend that does the real work.

## Running it

```
npm install
npm start
```

Open http://localhost:3000. Use the camera scanner or type a barcode manually
(try `3017620422003` — Nutella, flags palm oil and soya lecithin) and toggle
between Pregnancy / Nursing mode.

## API

`GET /api/scan/:barcode`

```json
{
  "found": true,
  "product": { "name": "...", "brand": "...", "image": "..." },
  "overall": { "pregnancy": "caution", "nursing": "safe" },
  "flagged": [
    {
      "ingredient": "retinol",
      "pregnancy": { "verdict": "avoid", "reason": "..." },
      "nursing": { "verdict": "caution", "reason": "..." }
    }
  ]
}
```

If the barcode isn't in Open Food Facts, `found` is `false`. If ingredients are found
but none match the safety dataset, `overall` verdicts are `"unknown"`.

## Data sources

- **Product & ingredient data**: [Open Food Facts](https://openfoodfacts.org) (open,
  free, no API key).
- **Safety verdicts**: hand-curated for this hackathon — see
  `server/data/ingredientSafety.json` to extend it. Roughly 60-80 well-known
  pregnancy/nursing-relevant ingredients (caffeine, alcohol, high-mercury fish,
  unpasteurized soft cheeses, deli meat, high-dose vitamin A/retinoids, certain herbs,
  common safe preservatives, etc.).

## Limitations

- No OCR fallback for products not in Open Food Facts (barcode lookup only).
- Dataset covers a limited, hand-picked set of ingredients — an unmatched ingredient
  means "no data," not "safe."
- No accounts, history, or persistence.
- Educational demo only — not medical advice.
