"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import VariantEditor from "@/components/VariantEditor";
import { buildVariants, validateVariants } from "@/lib/vendorProducts";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "out-of-stock", label: "Out of stock" },
];

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (!snap.exists() || snap.data().vendorId !== auth.currentUser?.uid) {
          setError("Product not found.");
          return;
        }
        const p = { id: snap.id, ...snap.data() };
        setProduct(p);
        setName(p.name || "");
        setPrice(String(p.price ?? ""));
        setDescription(p.description || "");
        setStatus(p.status === "uploading" ? "active" : p.status || "active");
        setVariants(
          (p.variants?.length ? p.variants : [{ size: "", color: "", stock: p.stock ?? 0 }]).map((v) => ({
            size: v.size || "",
            color: v.color || "",
            stock: String(v.stock ?? 0),
          }))
        );
      } catch (e) {
        console.error(e);
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const priceNum = Number(price);
    if (!name.trim() || !priceNum || priceNum <= 0) return setError("Name and a valid price are required.");
    const vErr = validateVariants(variants);
    if (vErr) return setError(vErr);

    setSaving(true);
    try {
      await updateDoc(doc(db, "products", id), {
        name: name.trim(),
        price: priceNum,
        description: description.trim(),
        status,
        ...buildVariants(variants),
        updatedAt: serverTimestamp(),
        stockUpdatedAt: serverTimestamp(),
      });
      router.push("/vendor/products");
    } catch (err) {
      console.error(err);
      setError("Could not save changes.");
      setSaving(false);
    }
  };

  if (loading) return <div className="container-page py-6 text-ink-500">Loading…</div>;
  if (!product) return <div className="container-page py-6 text-red-600">{error}</div>;

  return (
    <form onSubmit={save} className="container-page max-w-2xl space-y-6 py-6">
      <h1 className="text-2xl font-bold text-ink-900">Edit product</h1>

      <div className="flex gap-2">
        {product.images?.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
        ))}
      </div>

      <section className="card space-y-3 p-4">
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" type="number" min="0" step="0.01" placeholder={`Price (${product.currency || "GHS"})`}
          value={price} onChange={(e) => setPrice(e.target.value)} />
        <textarea className="input min-h-28" placeholder="Description" value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button type="button" key={s.value} onClick={() => setStatus(s.value)}
              className={status === s.value ? "btn-primary" : "btn-outline"}>{s.label}</button>
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Variants &amp; stock</h2>
        <VariantEditor variants={variants} setVariants={setVariants} />
      </section>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="button" className="btn-outline flex-1" onClick={() => router.back()}>Cancel</button>
        <button className="btn-primary flex-1" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}