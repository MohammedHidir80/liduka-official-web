// utils/notifications.js
import {
  BellIcon, HandPeaceIcon, ShoppingBasketIcon, CheckIcon, XCircleIcon,
  TruckIcon, BoxIcon, StoreIcon, AlertTriangleIcon,
} from "@/components/icons";

export const getIconDetails = (type) => {
  switch (type) {
    // Buyer types (same as mobile)
    case "welcome": return { Icon: HandPeaceIcon, color: "text-emerald-500", bg: "bg-emerald-50" };
    case "order_created":
    case "order_placed": return { Icon: ShoppingBasketIcon, color: "text-amber-500", bg: "bg-amber-50" };
    case "order_accepted": return { Icon: CheckIcon, color: "text-emerald-500", bg: "bg-emerald-50" };
    case "order_cancelled": return { Icon: XCircleIcon, color: "text-rose-500", bg: "bg-rose-50" };
    case "order_shipped": return { Icon: TruckIcon, color: "text-blue-500", bg: "bg-blue-50" };
    case "order_delivered": return { Icon: BoxIcon, color: "text-purple-500", bg: "bg-purple-50" };

    // Vendor types
    case "welcome_vendor": return { Icon: StoreIcon, color: "text-brand-500", bg: "bg-brand-50" };
    case "new_order": return { Icon: ShoppingBasketIcon, color: "text-emerald-500", bg: "bg-emerald-50" };
    case "low_stock": return { Icon: AlertTriangleIcon, color: "text-amber-500", bg: "bg-amber-50" };

    default: return { Icon: BellIcon, color: "text-ink-500", bg: "bg-ink-100" };
  }
};