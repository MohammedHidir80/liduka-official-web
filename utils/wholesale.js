// utils/wholesale.js — wholesale pricing for the web screens (display + checkout lines).
// The server (functions/orders.js placeOrder) sets the real price with the same rule:
// when the TOTAL quantity of a product (all colours/sizes) reaches minQty, EVERY unit costs the wholesale price.

export function wholesaleOf(price, w) {
  const retail = Number(price) || 0;
  const q = Math.floor(Number(w?.minQty) || 0);
  const wp = Number(w?.price) || 0;
  return q >= 2 && wp > 0 && wp < retail ? { minQty: q, price: wp } : null;
}

// rows: [{ id, price, quantity, wholesale }] -> one result per row, same order
export function wholesalePricing(rows) {
  const qty = {};
  rows.forEach((r) => { qty[r.id] = (qty[r.id] || 0) + (Number(r.quantity) || 0); });
  return rows.map((r) => {
    const w = wholesaleOf(r.price, r.wholesale);
    const total = qty[r.id] || 0;
    const on = !!w && total >= w.minQty;
    return {
      price: on ? w.price : Number(r.price) || 0, // unit price that applies
      retailPrice: Number(r.price) || 0,
      onWholesale: on,
      wsPrice: w ? w.price : 0,
      need: w && !on ? w.minQty - total : 0, // how many more to unlock wholesale
    };
  });
}