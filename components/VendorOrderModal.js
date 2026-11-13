"use client";
import { useEffect, useState } from "react";
import { acceptOrder, shipOrder, deliverOrder, vendorCancelOrder } from "@/lib/vendorOrderActions";
import { formatPrice } from "@/utils/currency";

export const STATUS_STYLE = {
  pending: "bg-orange-100 text-orange-700",
  accepted: "bg-blue-100 text-blue-700",
  shipped: "bg-yellow-100 text-yellow-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function VendorOrderModal({ order, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msLeft, setMsLeft] = useState(0);

  const endsAt = order?.shipDelayEndsAt?.toMillis?.() ?? (order?.shipDelayEndsAt?.seconds ?? 0) * 1000;
  useEffect(() => {
    if (!endsAt) return setMsLeft(0);
    const tick = () => setMsLeft(Math.max(0, endsAt - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!order) return null;
  const cur = order.currency || "GHS";
  const status = (order.status || "").toLowerCase();
  // Old orders (no deliveryMode) count as platform delivery only if they have a shipment
  const platformDelivery = order.deliveryMode ? order.deliveryMode === "platform" : !!order.shipmentId;
  const waitingForRider = platformDelivery && order.deliveryStatus !== "delivered";
  const buyerPhone = order.address?.phone;
  const callBuyer = !platformDelivery && buyerPhone ? (
    <a href={`tel:${buyerPhone}`} className="btn-outline w-full text-center">
      📞 Call buyer to arrange delivery: {buyerPhone}
    </a>
  ) : null;

  const run = async (fn, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true); setError("");
    try { await fn(order); onClose(); }
    catch (e) { console.error(e); setError(e.message || "Action failed."); }
    finally { setBusy(false); }
  };

  const cancelBtn = (
    <button className="btn-outline flex-1 !border-red-300 !text-red-600" disabled={busy || order.cancelable === false}
      onClick={() => run(vendorCancelOrder, "Cancel this order? The buyer will be refunded.")}>
      {order.cancelable === false ? "Non-cancellable" : "Cancel order"}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <p className="break-all text-xs text-ink-500">Order {order.id}</p>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.productImage} alt="" className="h-20 w-20 rounded-lg bg-gray-100 object-cover" />
          <div>
            <p className="font-semibold text-ink-900">{order.productTitle}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[status] || "bg-gray-100"}`}>{status}</span>
            {order.couponCode && <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{order.couponCode}</span>}
          </div>
        </div>

        <dl className="mt-4 space-y-1 text-sm">
          <Row k="Unit price" v={formatPrice(order.unitPrice ?? order.price ?? 0, cur)} />
          <Row k="Quantity" v={`x${order.quantity}`} />
          {(order.color || order.size) && <Row k="Variant" v={[order.color, order.size].filter(Boolean).join(" · ")} />}
          <Row k="Total" v={formatPrice(order.finalTotal ?? order.total ?? 0, cur)} bold />
        </dl>

        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="font-medium">{order.address?.fullName}</p>
          <p>{order.address?.phone}</p>
          <p className="text-ink-500">{[order.address?.street, order.address?.city, order.address?.region].filter(Boolean).join(", ")}</p>
        </div>

        {order.deliveryPartnerName && <p className="mt-3 text-sm">🚚 Delivery partner: <b>{order.deliveryPartnerName}</b></p>}
        {!platformDelivery && (
          <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
            Delivery is arranged by you. Contact the buyer to agree on delivery; the buyer pays the rider directly.
          </p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {status === "pending" && (
            <>
              <button className="btn-primary flex-1" disabled={busy} onClick={() => run(acceptOrder)}>{busy ? "…" : "Accept order"}</button>
              {cancelBtn}
            </>
          )}
          {status === "accepted" && (
            <>
              <button className="btn-primary flex-1" disabled={busy || msLeft > 0} onClick={() => run(shipOrder)}>
                {msLeft > 0 ? `Ready for shipment in ${Math.ceil(msLeft / 60000)} min` : busy ? "…" : "Ready for shipment"}
              </button>
              {cancelBtn}
              {callBuyer}
            </>
          )}
          {status === "shipped" && (
            <>
              <button className="btn-primary w-full" disabled={busy || waitingForRider} onClick={() => run(deliverOrder)}>
                {waitingForRider ? "Waiting for rider confirmation" : busy ? "…" : "Mark as delivered"}
              </button>
              {callBuyer}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const Row = ({ k, v, bold }) => (
  <div className="flex justify-between"><dt className="text-ink-500">{k}</dt><dd className={bold ? "font-bold" : ""}>{v}</dd></div>
);