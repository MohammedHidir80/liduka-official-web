"use client";

import { useEffect, useState } from "react";
import { loadDeliveryZones, lookupDeliveryInfo } from "@/hooks/useDeliveryZones";
import useDeliverySettings from "@/hooks/useDeliverySettings";

const EMPTY = {
  loading: false,
  fee: 0,
  available: true,
  partnerByVendor: {},
  shipmentPartner: null, // kept for compatibility: partners are no longer auto-assigned
};

// Vendor mode: no fee. Platform mode: fee from the district table, and the order becomes an
// open job that a rider accepts in the delivery app. Zones: settings/deliveryZones (cached 10 min).
export default function useDeliveryQuote(address, lines) {
  const { settings, loading: settingsLoading } = useDeliverySettings();
  const mode = settings?.mode === "platform" ? "platform" : "vendor";
  const [state, setState] = useState(EMPTY);

  const region = address?.region || "";
  const city = address?.city || "";
  const hasLines = lines.length > 0;

  useEffect(() => {
    if (settingsLoading) return;

    if (mode === "vendor" || !region || !city || !hasLines) {
      setState(EMPTY);
      return;
    }

    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    loadDeliveryZones().then((regions) => {
      if (!alive) return;
      const info = lookupDeliveryInfo(regions, region, city);
      if (!info?.available) setState({ ...EMPTY, available: false });
      else setState({ ...EMPTY, fee: Number(info.fee) || 0 });
    });
    return () => { alive = false; };
  }, [mode, settingsLoading, region, city, hasLines]);

  return { ...state, mode, loading: settingsLoading || state.loading };
}