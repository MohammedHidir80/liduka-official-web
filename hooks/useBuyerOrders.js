// hooks/useBuyerOrders.js — the buyer's orders (one document per item, same as the web).
// Reads 15 at a time; refreshes when you open the tab (at most every 20s) and on pull-to-refresh.
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';

const PAGE = 15;
const toMs = (t) => (t?.toMillis ? t.toMillis() : t?.seconds ? t.seconds * 1000 : 0);

export const shapeOrder = (snap) => {
  const d = snap.data();
  return { ...d, id: snap.id, createdMs: toMs(d.createdAt), shipEndsMs: toMs(d.shipDelayEndsAt) };
};

export default function useBuyerOrders(uid) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const cursor = useRef(null);
  const lastLoad = useRef(0);
  const busy = useRef(false);

  const load = useCallback(async (reset) => {
    if (!uid || busy.current) return;
    busy.current = true;
    if (reset) setRefreshing(true);
    try {
      const q = query(collection(db, 'orders'), where('buyerId', '==', uid), orderBy('createdAt', 'desc'),
        ...(!reset && cursor.current ? [startAfter(cursor.current)] : []), limit(PAGE));
      const snap = await getDocs(q);
      cursor.current = snap.docs[snap.docs.length - 1] || cursor.current;
      setDone(snap.docs.length < PAGE);
      const got = snap.docs.map(shapeOrder).filter((o) => !o.buyerHidden); // "deleted" by the buyer = hidden
      setOrders((prev) => (reset ? got : [...prev, ...got.filter((g) => !prev.some((p) => p.id === g.id))]));
      setError(null);
      lastLoad.current = Date.now();
    } catch (e) {
      console.log('Orders error:', e?.code, e?.message); // a missing index prints a link here
      setError(e);
    } finally {
      busy.current = false; setLoading(false); setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => { setOrders([]); setLoading(!!uid); setDone(false); cursor.current = null; if (uid) load(true); }, [uid]);

  return {
    orders, loading, refreshing, done, error,
    refresh: () => load(true),
    refreshIfStale: () => { if (Date.now() - lastLoad.current > 20000) load(true); },
    loadMore: () => { if (!done) load(false); },
  };
}