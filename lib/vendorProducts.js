export const makeVariantId = (color, size) =>
  `${color || "noColor"}-${size || "noSize"}`.toLowerCase().replace(/\s+/g, "-");

export const emptyVariant = () => ({ size: "", color: "", stock: "" });

// Returns an error string, or null if the variants are valid
export function validateVariants(variants) {
  if (variants.some((v) => v.stock === "" || isNaN(Number(v.stock)) || Number(v.stock) < 0))
    return "Stock is required for each variant (0 or more).";
  const seen = new Set();
  for (const v of variants) {
    const key = makeVariantId(v.color.trim(), v.size.trim());
    if (seen.has(key)) return "You cannot add the same size and color combination twice.";
    seen.add(key);
  }
  return null;
}

export function buildVariants(variants) {
  const clean = variants.map((v) => ({
    size: v.size.trim() || null,
    color: v.color.trim() || null,
    stock: parseInt(v.stock, 10),
    variantId: makeVariantId(v.color.trim(), v.size.trim()),
  }));
  const totalStock = clean.reduce((s, v) => s + v.stock, 0);
  return { variants: clean, totalStock, inStock: totalStock > 0 };
}

export const productTotalStock = (p) =>
  Array.isArray(p.variants) && p.variants.length
    ? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
    : Number(p.stock) || 0;