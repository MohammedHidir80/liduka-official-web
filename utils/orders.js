// utils/orders.js
import { ClockIcon, CheckIcon, TruckIcon, XCircleIcon } from "@/components/icons";

export const STATUS_STYLES = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", icon: ClockIcon },
  accepted: { bg: "bg-sky-50", text: "text-sky-700", icon: CheckIcon },
  shipped: { bg: "bg-indigo-50", text: "text-indigo-700", icon: TruckIcon },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckIcon },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", icon: XCircleIcon },
};

export const statusKey = (order) => (order?.status || "pending").toLowerCase();

export const capitalize = (word = "") =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

// Display names for statuses. The stored value stays "shipped"; only the wording changes.
export const STATUS_LABELS = { shipped: "Ready for shipment" };
export const statusLabel = (key = "") => STATUS_LABELS[key] || capitalize(key);

// "Delivered (by buyer)" when the buyer confirmed it, same as mobile
export const badgeText = (order) => {
  const status = statusKey(order);
  if (status !== "delivered") return statusLabel(status);
  return order.markedDeliveredBy ? `Delivered (by ${order.markedDeliveredBy})` : "Delivered";
};

// Same messages as mobile's getDeliveryMessage
export const deliveryMessage = (order) => {
  const vendorStatus = (order.status || "").toLowerCase();
  const delivery = (order.deliveryStatus || "").toLowerCase();

  if (vendorStatus === "cancelled") return "Order was cancelled";
  if (vendorStatus === "pending") return "Your order is waiting for vendor confirmation";
  if (vendorStatus === "accepted") return "Vendor is preparing your order";
  if (vendorStatus === "shipped") {
    if (!delivery || delivery === "waiting_vendor") return "Vendor has prepared your order";
    if (delivery === "assigned") return "A rider has been assigned to your order";
    if (delivery === "ready_for_pickup") return "Your order is ready for pickup";
    if (delivery === "picked_up") return "Rider has picked up your order";
    if (delivery === "in_transit") return "Your order is on the way";
    if (delivery === "delivered") return "Your order has been delivered";
    return "Preparing delivery";
  }
  if (vendorStatus === "delivered") return "Order completed successfully";
  return "Processing your order...";
};

export const toDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
};

export const formatDateTime = (ts) => {
  const d = toDate(ts);
  return d ? d.toLocaleString() : "N/A";
};

export const relativeTime = (ts) => {
  const d = toDate(ts);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateTime(ts);
};