// utils/variants.js
// The cart still uses the old { Color, Size } object until the cart step.
export function toCartVariants(variant) {
  const out = {};
  if (variant?.color) out.Color = variant.color;
  if (variant?.size) out.Size = variant.size;
  return out;
}