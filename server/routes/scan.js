import { Router } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { lookupProduct } from "../services/productLookup.js";
import { evaluate } from "../services/safetyEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "ingredientSafety.json");
const safetyDb = JSON.parse(readFileSync(dbPath, "utf-8"));

const router = Router();

router.get("/:barcode", async (req, res) => {
  const { barcode } = req.params;
  if (!/^\d{6,14}$/.test(barcode)) {
    return res.status(400).json({ error: "Invalid barcode format" });
  }

  try {
    const product = await lookupProduct(barcode);
    if (!product.found) {
      return res.json({ found: false });
    }

    const { overall, flagged } = evaluate(product.ingredients, safetyDb);
    res.json({
      found: true,
      product: {
        name: product.name,
        brand: product.brand,
        image: product.image,
      },
      overall,
      flagged,
    });
  } catch (err) {
    console.error("Scan lookup failed:", err.message);
    res.status(502).json({ error: "Failed to look up product" });
  }
});

export default router;
