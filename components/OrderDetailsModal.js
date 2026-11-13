"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, shortDate } from "@/lib/format";
import { useWallet } from "@/context/WalletContext";
import { useOrders } from "@/context/OrderContext";
import { 
  XIcon, CheckIcon, BoxIcon, ClockIcon, TruckIcon, XCircleIcon,
  ReceiptIcon, CalendarIcon, PaletteIcon, BikeIcon, StarFilledIcon, TrashIcon 
} from "./icons";

const statusStyles = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", icon: ClockIcon },
  accepted: { bg: "bg-sky-50", text: "text-sky-700", icon: CheckIcon },
  shipped: { bg: "bg-indigo-50", text: "text-indigo-700", icon: TruckIcon },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckIcon },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", icon: XCircleIcon },
};

export default function OrderDetailsModal({ order, onClose }) {
  const router = useRouter();
  const { addFunds } = useWallet();
  const { updateOrder, deleteOrder } = useOrders();

  if (!order) return null;

  const status = (order.status || "pending").toLowerCase();
  const style = statusStyles[status] || statusStyles.pending;
  const StatusIcon = style.icon;

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this order? You will be refunded.")) {
      addFunds(order.total); // Refund to wallet
      updateOrder(order.id, { status: "cancelled" });
      onClose();
      window.alert("Order Cancelled. Funds refunded to your wallet.");
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to permanently delete this order?")) {
      deleteOrder(order.id);
      onClose();
    }
  };

  const handleMarkDelivered = () => {
    updateOrder(order.id, { status: "delivered" });
    onClose();
    window.alert("Order marked as delivered.");
  };

  // Mock address since we didn't collect one at checkout
  const mockAddress = {
    fullName: "Ama Mensah",
    phone: "+233 24 123 4567",
    street: "12 Independence Ave",
    city: "Accra",
    region: "Greater Accra"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-lg max-h-[90vh] flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 p-4">
          <h2 className="text-lg font-extrabold text-ink-900">Order Details</h2>
          <button 
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 hover:bg-ink-100"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Order ID Banner */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 p-3 text-brand-700">
            <ReceiptIcon size={18} />
            <span className="text-sm font-bold">Order ID: {order.id}</span>
          </div>

          {/* Product Info */}
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100">
              {order.items[0]?.image ? (
                <img src={order.items[0].image} alt="" className="h-full w-full object-cover" />
              ) : (
                <BoxIcon size={24} className="m-auto h-full text-ink-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-ink-900 leading-tight">
                {order.items[0]?.title || "Unknown Item"}
                {order.items.length > 1 && (
                  <span className="text-sm font-normal text-ink-500 ml-1">
                    (+{order.items.length - 1} more)
                  </span>
                )}
              </h3>
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                <StatusIcon size={12} />
                {status}
              </div>
              <p className="mt-2 text-xs text-ink-500">
                {status === 'pending' && "Waiting for vendor confirmation."}
                {status === 'accepted' && "Vendor is preparing your order."}
                {status === 'shipped' && "Your order is on the way."}
                {status === 'delivered' && "Order completed successfully."}
                {status === 'cancelled' && "Order was cancelled."}
              </p>
            </div>
          </div>

          {/* Delivery Partner (Mock) */}
          {status === 'shipped' && (
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <BikeIcon size={20} className="text-brand-600" />
              <div>
                <p className="text-[11px] font-semibold text-ink-500 uppercase">Delivery Partner</p>
                <p className="text-sm font-bold text-ink-900">Kwame Rider</p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
            <h4 className="text-sm font-bold text-ink-900 mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Unit Price</span>
                <span className="font-semibold text-ink-900">{formatMoney(order.items[0]?.price || 0)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Quantity</span>
                <span className="font-semibold text-ink-900">x{order.items[0]?.qty || 1}</span>
              </div>
              {order.items[0]?.variants && Object.keys(order.items[0].variants).length > 0 && (
                <div className="flex justify-between text-ink-600">
                  <span>Variants</span>
                  <span className="font-semibold text-ink-900">
                    {Object.values(order.items[0].variants).join(" · ")}
                  </span>
                </div>
              )}
            </div>
            
            <div className="my-3 h-px w-full bg-ink-200" />
            
            <div className="space-y-1">
              <div className="flex justify-between font-extrabold text-ink-900 text-base">
                <span>Total Paid</span>
                <span className="text-brand-600">{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address (Mock) */}
          <div className="rounded-2xl border border-ink-100 p-4">
            <h4 className="text-sm font-bold text-ink-900 mb-3">Shipping Address</h4>
            <div className="space-y-2 text-sm text-ink-600">
              <p className="font-bold text-ink-900">{mockAddress.fullName}</p>
              <p>{mockAddress.phone}</p>
              <p>{mockAddress.street}, {mockAddress.city}, {mockAddress.region}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {status === 'delivered' && (
              <button 
                onClick={() => router.push(`/products/${order.items[0]?.productId}`)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-700"
              >
                <StarFilledIcon size={16} /> Review Product
              </button>
            )}

            {status === 'shipped' && (
              <button 
                onClick={handleMarkDelivered}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                <CheckIcon size={16} /> Mark as Delivered
              </button>
            )}

            {['pending', 'accepted'].includes(status) && (
              <button 
                onClick={handleCancel}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600"
              >
                <XCircleIcon size={16} /> Cancel Order
              </button>
            )}

            {['cancelled', 'delivered'].includes(status) && (
              <button 
                onClick={handleDelete}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-600 hover:bg-rose-100"
              >
                <TrashIcon size={16} /> Delete Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}