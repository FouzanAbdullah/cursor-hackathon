const VERDICT_RANK = { safe: 0, caution: 1, avoid: 2 };

function normalizeOffId(offId) {
  return offId.replace(/^[a-z]{2,3}:/, "").toLowerCase();
}

function findEntry(ingredient, db) {
  const normId = ingredient.id ? normalizeOffId(ingredient.id) : null;
  if (normId) {
    const byId = db.find((e) => e.id === normId);
    if (byId) return byId;
  }

  const text = (ingredient.text || "").toLowerCase();
  if (!text) return null;

  return (
    db.find((e) => e.aliases.some((alias) => text.includes(alias.toLowerCase()))) ||
    db.find((e) => text.includes(e.id.replace(/-/g, " ")))
  );
}

export function matchIngredients(ingredients, db) {
  const flagged = [];
  const seen = new Set();

  for (const ingredient of ingredients) {
    const entry = findEntry(ingredient, db);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    flagged.push({
      ingredient: entry.id,
      matchedText: ingredient.text || ingredient.id || entry.id,
      pregnancy: entry.pregnancy,
      nursing: entry.nursing,
    });
  }

  return flagged;
}

function aggregateVerdict(flagged, mode) {
  if (flagged.length === 0) return "unknown";
  let worst = "safe";
  for (const item of flagged) {
    const verdict = item[mode].verdict;
    if (VERDICT_RANK[verdict] > VERDICT_RANK[worst]) worst = verdict;
  }
  return worst;
}

export function evaluate(ingredients, db) {
  const flagged = matchIngredients(ingredients, db);
  return {
    overall: {
      pregnancy: aggregateVerdict(flagged, "pregnancy"),
      nursing: aggregateVerdict(flagged, "nursing"),
    },
    flagged,
  };
}
