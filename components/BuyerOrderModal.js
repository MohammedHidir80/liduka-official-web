"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cancelOrder, markOrderDelivered, deleteOrder } from "@/lib/orderActions";
import { STATUS_STYLES, statusKey, badgeText, deliveryMessage, formatDateTime } from "@/utils/orders";
import { districtLabel, regionLabel } from "@/utils/ghana";
import { formatPrice } from "@/utils/currency";
import { BagIcon, BikeIcon, BoxIcon, XIcon } from "@/components/icons";

const money = (n) => formatPrice(n, "GHS");

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className={strong ? "font-bold text-ink-900" : "text-ink-500"}>{label}</span>
      <span className={`text-right ${strong ? "font-extrabold text-ink-900" : "font-semibold text-ink-800"}`}>
        {value}
      </span>
    </div>
  );
}

export default function BuyerOrderModal({ order, onClose }) {
  const [busy, setBusy] = useState(null); // "cancel" | "deliver" | "delete"
  const [notice, setNotice] = useState(null); // { type: "error" | "success", message }

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status = statusKey(order);
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const StatusIcon = style.icon;
  const delivery = (order.deliveryStatus || "").toLowerCase();

  const canConfirmDelivery = status === "shipped" && delivery === "delivered";
  const canCancel = ["pending", "accepted"].includes(status) && order.cancelable !== false;
  const couponLocked = ["pending", "accepted"].includes(status) && order.cancelable === false;
  const canDelete = ["cancelled", "delivered"].includes(status);

  const variantText = [order.color, order.size].filter(Boolean).join(" · ");
  const a = order.address;

  const run = async (kind, fn, successMessage) => {
    setBusy(kind);
    setNotice(null);
    try {
      const result = await fn();
      if (kind === "delete") return onClose();
      setNotice({ type: "success", message: successMessage(result) });
    } catch (err) {
      console.error(`${kind} failed:`, err);
      setNotice({ type: "error", message: err.message || "Something went wrong." });
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    run("cancel", () => cancelOrder(order), (refund) => `Order cancelled. ${money(refund)} was refunded to your wallet.`);
  };

  const handleDeliver = () =>
    run("deliver", () => markOrderDelivered(order.id), () => "Order marked as delivered.");

  const handleDelete = () => {
    if (!confirm("Are you sure you want to permanently delete this order?")) return;
    run("delete", () => deleteOrder(order.id), () => "");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-100 p-4 sm:p-5">
          <h2 className="text-lg font-extrabold text-ink-900">Order Details</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 transition hover:bg-ink-100"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs font-bold text-ink-800">
            <BagIcon size={16} className="text-brand-600" />
            <span className="break-all">Order ID: {order.id}</span>
          </div>

          <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-ink-100">
            {order.productImage ? (
              <img src={order.productImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-ink-300">
                <BoxIcon size={40} />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-ink-900">{order.productTitle}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${style.bg} ${style.text}`}
              >
                <StatusIcon size={12} /> {badgeText(order)}
              </span>
              {order.couponCode && (
                <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                  {order.couponCode}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-ink-500">{deliveryMessage(order)}</p>

            {order.deliveryPartnerName && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                <span className="text-brand-600">
                  <BikeIcon size={18} />
                </span>
                <div>
                  <p className="text-xs text-ink-500">Delivery Partner</p>
                  <p className="text-sm font-bold text-ink-900">{order.deliveryPartnerName}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-ink-50 p-4">
            <h4 className="mb-2 text-sm font-extrabold text-ink-900">Order Summary</h4>
            <Row label="Placed" value={formatDateTime(order.createdAt)} />
            <Row label="Unit Price" value={money(order.unitPrice || 0)} />
            <Row label="Quantity" value={`x${order.quantity || 1}`} />
            {variantText && <Row label="Variant" value={variantText} />}
            <div className="my-2 h-px bg-ink-200" />
            <Row label="Original Total" value={money(order.total || 0)} strong />
            {Number(order.discount) > 0 && (
              <Row label="Discount" value={`-${money(order.discount)}`} />
            )}
            <Row label="Final Paid" value={money(order.finalTotal ?? order.total ?? 0)} strong />
          </div>

          {a && (
            <div className="rounded-2xl bg-ink-50 p-4">
              <h4 className="mb-2 text-sm font-extrabold text-ink-900">Shipping Address</h4>
              <div className="space-y-1 text-sm text-ink-700">
                {a.fullName && <p className="font-semibold text-ink-900">{a.fullName}</p>}
                {a.phone && <p>{a.phone}</p>}
                <p>
                  {[a.street, districtLabel(a.region, a.city), regionLabel(a.region)]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}

          {notice && (
            <p
              role="alert"
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                notice.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {notice.message}
            </p>
          )}

          <div className="space-y-3 pb-2">
            {status === "delivered" && order.productId && (
              <Link href={`/products/${order.productId}`} className="btn-primary flex w-full justify-center py-3">
                Review Product
              </Link>
            )}

            {canConfirmDelivery && (
              <button
                onClick={handleDeliver}
                disabled={!!busy}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy === "deliver" ? "Updating..." : "Mark as Delivered"}
              </button>
            )}

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={!!busy}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
              >
                {busy === "cancel" ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            {couponLocked && (
              <p className="rounded-xl bg-ink-100 py-3 text-center text-sm font-bold text-ink-500">
                Cannot Cancel (Coupon Used)
              </p>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={!!busy}
                className="w-full rounded-xl border border-rose-200 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              >
                {busy === "delete" ? "Deleting..." : "Delete Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}