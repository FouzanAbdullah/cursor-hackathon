const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "product_name,brands,image_front_url,ingredients,ingredients_text";

export async function lookupProduct(barcode) {
  const url = `${OFF_BASE}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Expecta-Hackathon-Demo/1.0 (contact: hackathon-demo)" },
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts request failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    return { found: false };
  }

  const p = data.product;
  const ingredients = (p.ingredients || []).map((i) => ({
    id: i.id || null,
    text: i.text || "",
  }));

  return {
    found: true,
    name: p.product_name || "Unknown product",
    brand: p.brands || "",
    image: p.image_front_url || null,
    ingredients,
    ingredientsText: p.ingredients_text || "",
  };
}
