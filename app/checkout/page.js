"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWallet } from "@/context/WalletContext";
import { useSettings } from "@/context/SettingsContext";
import useCheckoutLines from "@/hooks/useCheckoutLines";
import useDeliveryQuote from "@/hooks/useDeliveryQuote";
import { placeOrder, allocateDiscounts, round2, WALLET_CURRENCY } from "@/lib/placeOrder";
import { validateAndApplyCoupon } from "@/utils/coupon";
import { getPlatformFee } from "@/utils/fees";
import { formatPrice } from "@/utils/currency";
import { districtLabel, regionLabel } from "@/utils/ghana";
import { WalletIcon, CheckIcon, ChevronLeftIcon, MapPinIcon, XIcon } from "@/components/icons";

const money = (n) => formatPrice(n, WALLET_CURRENCY);

// "Kofi Mensah, Tamale Metro, Northern": district and region as readable labels
const addressLine = (a) =>
  [a.street, districtLabel(a.region, a.city), regionLabel(a.region)].filter(Boolean).join(", ");

function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { removeMultipleFromCart } = useCart();
  const { balance, ready: walletReady } = useWallet();
  const { t } = useSettings();
  const { lines, loading: linesLoading, problem, source } = useCheckoutLines();

  // Addresses live on users/{uid}.addresses, same as mobile
  const addresses = useMemo(
    () =>
      Object.entries(user?.addresses || {})
        .map(([id, val]) => ({ id, ...val }))
        .filter((a) => a.street && a.city && a.region),
    [user?.addresses]
  );
  const [addressId, setAddressId] = useState(null);
  const [addressModal, setAddressModal] = useState(false);
  const selectedAddress = addresses.find((a) => a.id === addressId) || addresses[0] || null;

  const quote = useDeliveryQuote(selectedAddress, lines);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null); // "valid" | "error"
  const [couponMessage, setCouponMessage] = useState("");
  const [perProductDiscounts, setPerProductDiscounts] = useState({});
  const [couponLoading, setCouponLoading] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const singleVendor = lines.length > 0 && lines.every((l) => l.vendorId === lines[0].vendorId);

  // Totals (the wallet and all fees are in GHS, like the platform wallet on mobile)
  const lineDiscounts = useMemo(
    () => allocateDiscounts(lines, perProductDiscounts),
    [lines, perProductDiscounts]
  );
  const discount = round2(lineDiscounts.reduce((s, n) => s + n, 0));
  const totalPrice = round2(lines.reduce((s, l) => s + l.price * l.quantity, 0));
  const finalPrice = Math.max(round2(totalPrice - discount), 0);
  const purchaseFee = getPlatformFee(WALLET_CURRENCY, finalPrice);
  const deliveryFee = quote.fee;
  const grandTotal = round2(finalPrice + purchaseFee + deliveryFee);
  const insufficient = walletReady && balance < grandTotal;

  // Vendor arranged delivery: the vendor phones the buyer, so the address needs a phone number
  const missingPhone = quote.mode === "vendor" && !!selectedAddress && !selectedAddress.phone;

  const hasInvalid = lines.some((l) => !l.valid);
  const hasForeignCurrency = lines.some((l) => l.currency !== WALLET_CURRENCY);
  const canPlace =
    lines.length > 0 &&
    !hasInvalid &&
    !hasForeignCurrency &&
    !!selectedAddress &&
    !missingPhone &&
    !quote.loading &&
    walletReady &&
    !insufficient &&
    !placing;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !singleVendor) return;
    setCouponLoading(true);
    setCouponStatus(null);
    setCouponMessage("");
    try {
      const result = await validateAndApplyCoupon(
        couponCode,
        lines[0].vendorId,
        lines.map((l) => ({
          id: l.id,
          title: l.title,
          price: l.price,
          quantity: l.quantity,
          vendorId: l.vendorId,
          category: l.category || "",
        })),
        user.uid
      );
      setPerProductDiscounts(result.perProductDiscounts || {});
      setCouponStatus("valid");
    } catch (err) {
      console.error(err);
      setPerProductDiscounts({});
      setCouponStatus("error");
      setCouponMessage(err.message || "Coupon not valid for selected products");
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError("");
    if (!selectedAddress) return setError("Select delivery address");
    if (missingPhone) return setError("Add a phone number to this address so the vendor can contact you.");
    if (insufficient) {
      return setError(`You need at least ${money(grandTotal)} to complete this purchase.`);
    }
    if (!canPlace) return;

    setPlacing(true);
    try {
      // The server prices everything, applies the coupon and counts its usage.
      await placeOrder({
        lines,
        address: selectedAddress,
        couponCode: couponStatus === "valid" ? couponCode.trim() : "",
      });

      // Remove purchased items from the cart. Buy Now never came from the cart,
      // so it leaves the cart alone.
      if (source !== "buy") removeMultipleFromCart(lines);

      setDone(true);
    } catch (err) {
      console.error("Order placement failed:", err);
      setError(err.message || "An error occurred.");
    } finally {
      setPlacing(false);
    }
  };

  // ---------- screens ----------
  if (done) {
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <div className="mb-6 grid h-20 w-20 animate-bounce place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckIcon size={40} strokeWidth={3} />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-ink-900">Order Placed</h1>
        <p className="mb-8 text-sm text-ink-500">Your order has been placed successfully.</p>
        <Link href="/orders" className="btn-primary w-full max-w-xs">
          {t.viewOrders}
        </Link>
      </div>
    );
  }

  if (linesLoading) {
    return (
      <div className="container-page max-w-2xl py-6">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-ink-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-ink-100" />
      </div>
    );
  }

  if (problem || lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-lg font-bold text-ink-900">{problem || t.emptyCart}</h1>
        <button onClick={() => router.push("/")} className="btn-primary mt-4">
          {t.goShopping}
        </button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-6 pb-28">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm font-bold text-ink-500 hover:text-ink-900"
      >
        <ChevronLeftIcon size={16} /> {source === "buy" ? "Back" : t.backToCart}
      </button>

      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">
        {lines.length > 1 ? "Bulk Checkout" : t.checkout}
      </h1>

      <div className="space-y-5">
        {/* Delivery address */}
        <button
          onClick={() => setAddressModal(true)}
          className="card w-full p-5 text-left transition hover:bg-ink-50"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-600">
              <MapPinIcon size={16} />
            </span>
            <h2 className="flex-1 text-base font-bold text-ink-900">Delivery Address</h2>
            <span className="text-sm font-bold text-brand-600">
              {selectedAddress ? "Change" : "Select"}
            </span>
          </div>
          {selectedAddress ? (
            <div className="pl-10 text-sm">
              <p className="font-semibold text-ink-900">{user?.fullName}</p>
              <p className="text-ink-500">{addressLine(selectedAddress)}</p>
              {selectedAddress.phone && <p className="text-ink-500">{selectedAddress.phone}</p>}
            </div>
          ) : (
            <p className="pl-10 text-sm italic text-ink-500">Tap to select delivery address</p>
          )}
        </button>

        {/* Order summary */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-900">{t.orderSummary}</h2>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              {lines.length} {lines.length === 1 ? "item" : "items"}
            </span>
          </div>

          <ul className="space-y-4">
            {lines.map((l) => {
              const variantText = [l.color, l.size].filter(Boolean).join(" • ");
              return (
                <li key={l.key} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                    {l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold text-ink-900">{l.title}</p>
                    {variantText && <p className="text-xs text-ink-500">{variantText}</p>}
                    {!l.valid && (
                      <p className="mt-0.5 text-xs font-semibold text-rose-500">
                        This item is unavailable. Update your cart.
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-ink-500">
                        {money(l.price)} x {l.quantity}
                        {l.onWholesale && (
                          <>
                            {" "}
                            <span className="text-xs text-ink-400 line-through">{money(l.retailPrice)}</span>{" "}
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                              WHOLESALE
                            </span>
                          </>
                        )}
                      </span>
                      <span className="font-bold text-ink-900">{money(l.price * l.quantity)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Coupon */}
        {singleVendor ? (
          <div className="card p-5">
            <h2 className="mb-3 text-base font-bold text-ink-900">Have a coupon?</h2>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="input"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="btn-primary shrink-0 px-5"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
            {couponStatus === "valid" && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Coupon applied! You saved {money(discount)}
              </p>
            )}
            {couponStatus === "error" && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
                {couponMessage}
              </p>
            )}
          </div>
        ) : (
          <p className="card p-4 text-sm italic text-ink-500">
            Coupons not available for multi-vendor purchases
          </p>
        )}

        {/* Price details */}
        <div className="card p-5">
          <h2 className="mb-4 text-base font-bold text-ink-900">Price Details</h2>
          <div className="space-y-2 text-sm text-ink-600">
            <div className="flex justify-between">
              <span>Subtotal ({lines.length} items)</span>
              <span className="font-semibold text-ink-900">{money(totalPrice)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-semibold text-emerald-600">-{money(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="font-semibold text-ink-900">{money(purchaseFee)}</span>
            </div>
            {quote.mode === "vendor" && (
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-ink-900">Arranged with vendor</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-ink-900">{money(deliveryFee)}</span>
              </div>
            )}
          </div>
          {quote.mode === "vendor" && (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              🚚 The vendor will contact you to arrange delivery. No delivery fee is charged at checkout; you
              pay the rider directly.
            </p>
          )}
          {selectedAddress && !quote.loading && !quote.available && (
            <p className="mt-3 text-xs text-ink-400">
              Delivery isn't available for this address. Contact the vendor to arrange it.
            </p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
            <span className="text-base font-bold text-ink-900">Total Amount</span>
            <span className="text-xl font-extrabold text-brand-600">{money(grandTotal)}</span>
          </div>
        </div>

        {/* Wallet */}
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink-900">
            <WalletIcon size={18} className="text-brand-600" /> {t.paymentMethod}
          </h2>
          <div
            className={`flex items-center justify-between rounded-xl border p-4 ${
              insufficient ? "border-rose-200 bg-rose-50" : "border-brand-600 bg-brand-50"
            }`}
          >
            <div>
              <p className="text-sm font-bold text-ink-900">Your Wallet Balance</p>
              <p
                className={`text-xl font-extrabold ${
                  insufficient ? "text-rose-600" : "text-brand-700"
                }`}
              >
                {money(balance)}
              </p>
            </div>
            {insufficient && (
              <Link href="/wallet" className="btn-outline border-rose-200 text-xs text-rose-600">
                {t.topUp}
              </Link>
            )}
          </div>
          {insufficient && (
            <p className="mt-2 text-xs font-semibold text-rose-500">Insufficient balance</p>
          )}
        </div>

        {missingPhone && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            This address has no phone number, so the vendor can't reach you to arrange delivery.{" "}
            <Link href="/addresses" className="underline">
              Add one
            </Link>
          </p>
        )}

        {hasForeignCurrency && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            Some items are priced in a currency other than {WALLET_CURRENCY} and can't be bought
            with your wallet yet.
          </p>
        )}

        {hasInvalid && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            Some items are unavailable.{" "}
            <Link href="/cart" className="underline">
              Review your cart
            </Link>
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
          >
            {error}
          </p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={!canPlace}
          className="btn-primary w-full py-4 text-base"
        >
          {placing
            ? t.processing
            : `${lines.length > 1 ? "Place Bulk Order" : "Place Order"} · ${money(grandTotal)}`}
        </button>
      </div>

      {/* Address picker */}
      {addressModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setAddressModal(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink-100 p-4">
              <h3 className="text-lg font-extrabold text-ink-900">Select Delivery Address</h3>
              <button
                onClick={() => setAddressModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-500 hover:bg-ink-100"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {addresses.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-semibold text-ink-900">No saved addresses</p>
                  <p className="mt-1 text-sm text-ink-500">Please add an address in your profile.</p>
                  <Link href="/addresses" className="btn-primary mt-4 inline-flex">
                    Manage addresses
                  </Link>
                </div>
              ) : (
                addresses.map((a) => {
                  const active = selectedAddress?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAddressId(a.id);
                        setAddressModal(false);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active ? "border-brand-600 bg-brand-50" : "border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      <p className="text-sm font-bold text-ink-900">{user?.fullName}</p>
                      <p className="text-sm text-ink-500">{addressLine(a)}</p>
                      {a.phone && <p className="text-xs text-ink-400">{a.phone}</p>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}