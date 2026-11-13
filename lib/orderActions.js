// lib/orderActions.js — buyer side, thin wrappers over functions/orders.js
import { call, cleanError } from "@/lib/placeOrder";
const idOf = (o) => (typeof o === "string" ? o : o?.id || o?.orderId);

const run = async (name, data) => {
  try { await call(name)(data); } catch (e) { throw new Error(cleanError(e)); }
};

export const cancelOrder = (order) => run("cancelOrder", { orderId: idOf(order) });
export const markOrderDelivered = (order) => run("orderAction", { orderId: idOf(order), action: "deliver" });
export const deleteOrder = (order) => run("deleteOrder", { orderId: idOf(order) });