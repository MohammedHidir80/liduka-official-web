"use client";
import Link from "next/link";
import useVendorStats from "@/hooks/useVendorStats";
import { formatPrice } from "@/utils/currency";
import { 
  BoxIcon, WalletIcon, ClockIcon, StarFilledIcon, ChevronRightIcon, PlusIcon 
} from "@/components/icons"; // Assuming you have these

const Stars = ({ value }) => (
  <div className="flex items-center gap-1">
    <StarFilledIcon size={14} className="text-amber-500" />
    <span className="text-sm font-bold text-ink-900">{value.toFixed(1)}</span>
  </div>
);

// Skeleton Loader for Stats
const StatSkeleton = () => (
  <div className="card p-4 animate-pulse">
    <div className="mb-3 h-8 w-8 rounded-lg bg-ink-100" />
    <div className="mb-2 h-6 w-1/2 rounded bg-ink-100" />
    <div className="h-3 w-2/3 rounded bg-ink-100" />
  </div>
);

export default function VendorDashboardPage() {
  const { products, summary, loading } = useVendorStats();

  const tiles = [
    { label: "Total Products", value: summary.products, href: "/vendor/products", Icon: BoxIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Sales", value: formatPrice(summary.totalSales, "GHS"), href: "/vendor/orders", Icon: WalletIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Orders", value: summary.pendingOrders, href: "/vendor/orders", Icon: ClockIcon, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Avg. Rating", value: summary.overallRating ? summary.overallRating.toFixed(1) : "–", Icon: StarFilledIcon, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="container-page py-6 md:py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-500 mt-1">Track your store's performance and manage orders.</p>
        </div>
        <Link href="/vendor/products/new" className="btn-primary flex items-center justify-center gap-2 py-2.5 px-5">
          <PlusIcon size={18} /> Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <StatSkeleton key={i} />)
        ) : (
          tiles.map((t) => {
            const Wrapper = t.href ? Link : "div";
            return (
              <Wrapper
                key={t.label}
                href={t.href || "#"}
                className={`card flex flex-col justify-between p-4 transition ${t.href ? "hover:border-brand-300 hover:shadow-md cursor-pointer" : ""}`}
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${t.bg} ${t.color}`}>
                  <t.Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink-900 leading-tight">{t.value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mt-1">{t.label}</p>
                </div>
              </Wrapper>
            );
          })
        )}
      </div>

      {/* Product Performance */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Product Performance</h2>
          <Link href="/vendor/products" className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
            See all <ChevronRightIcon size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="card divide-y divide-ink-100 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 rounded-xl bg-ink-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-ink-100" />
                  <div className="h-3 w-1/2 rounded bg-ink-100" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-12 text-center">
            <BoxIcon size={40} className="mb-3 text-ink-300" />
            <h3 className="text-base font-bold text-ink-900">No products yet</h3>
            <p className="text-sm text-ink-500 mb-4">Add your first product to see performance here.</p>
            <Link href="/vendor/products/new" className="btn-primary">Add Product</Link>
          </div>
        ) : (
          <div className="card divide-y divide-ink-100 overflow-hidden">
            {products.map((p) => (
              <Link 
                key={p.id} 
                href={`/vendor/products/${p.id}/reviews`} 
                className="group flex items-center gap-4 p-4 transition hover:bg-ink-50"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100 border border-ink-200/50">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <BoxIcon size={20} className="m-auto h-full text-ink-400" />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink-900">{p.name}</p>
                  <p className="mt-1 text-xs font-medium text-ink-500">
                    {formatPrice(p.price, p.currency || "GHS")} · <span className="text-emerald-600">{p.salesCount} sold</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Stars value={p.averageRating} />
                  <p className="text-[11px] font-semibold text-ink-400">
                    {p.ratingsCount} review{p.ratingsCount === 1 ? "" : "s"}
                  </p>
                </div>
                <ChevronRightIcon size={18} className="text-ink-300 hidden sm:block" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}