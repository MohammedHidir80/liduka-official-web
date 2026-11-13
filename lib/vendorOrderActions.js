// lib/vendorOrderActions.js — thin wrappers, logic lives in functions/orders.js
import { call, cleanError } from "@/lib/placeOrder";
const idOf = (o) => (typeof o === "string" ? o : o?.id || o?.orderId);

const run = async (name, data) => {
  try { await call(name)(data); } catch (e) { throw new Error(cleanError(e)); }
};

export const acceptOrder = (order) => run("orderAction", { orderId: idOf(order), action: "accept" });
export const shipOrder = (order) => run("orderAction", { orderId: idOf(order), action: "ship" });   // "Ready for shipment"
export const deliverOrder = (order) => run("orderAction", { orderId: idOf(order), action: "deliver" });
export const vendorCancelOrder = (order) => run("cancelOrder", { orderId: idOf(order) });