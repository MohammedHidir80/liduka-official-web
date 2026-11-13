"use client";

import { useCallback, useMemo, useState } from "react";

// Same selection rules as mobile's ProductDetail:
// colors first, sizes for that color, one variant = auto-selected.
export default function useVariantPicker(variants = [], fallbackStock = 0) {
  // Products without a variants array behave as one variant using `stock`
  const list = useMemo(
    () =>
      variants.length
        ? variants
        : [{ variantId: null, color: null, size: null, stock: fallbackStock }],
    [variants, fallbackStock]
  );

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  const colors = useMemo(() => {
    const names = [...new Set(list.map((v) => v.color).filter(Boolean))];
    return names.map((name) => ({
      name,
      soldOut: list
        .filter((v) => v.color === name)
        .every((v) => (Number(v.stock) || 0) <= 0),
    }));
  }, [list]);

  const sizes = useMemo(() => {
    const map = new Map();
    for (const v of list) {
      if (!v.size) continue;
      if (v.color && v.color !== selectedColor) continue;
      map.set(v.size, { name: v.size, stock: Number(v.stock) || 0 });
    }
    return [...map.values()];
  }, [list, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (list.length === 1) return list[0];
    return (
      list.find(
        (v) =>
          (v.color ? v.color === selectedColor : true) &&
          (v.size ? v.size === selectedSize : true)
      ) || null
    );
  }, [list, selectedColor, selectedSize]);

  const selectColor = useCallback((c) => {
    setSelectedColor(c);
    setSelectedSize(null);
  }, []);

  return {
    colors,
    sizes,
    selectedColor,
    selectedSize,
    selectedVariant,
    selectColor,
    selectSize: setSelectedSize,
    needsSelection: list.length > 1,
  };
}