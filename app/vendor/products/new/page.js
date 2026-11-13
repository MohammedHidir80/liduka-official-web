"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, updateDoc, getDoc, getDocs, collection, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { uploadToR2 } from "@/lib/r2";
import VariantEditor from "@/components/VariantEditor";
import { buildVariants, emptyVariant, validateVariants } from "@/lib/vendorProducts";

// Delivery size decides the delivery fee. Keep these keys in sync with the mobile app and the delivery pricing settings.
const DELIVERY_CLASSES = [
  { key: "small", label: "Small", hint: "Phone, shoes, clothes · under 2 kg" },
  { key: "medium", label: "Medium", hint: "Blender, small TV, box of goods · 2–10 kg" },
  { key: "large", label: "Large", hint: "Microwave, big TV, mattress · 10–30 kg" },
  { key: "heavy", label: "Heavy", hint: "Fridge, sofa, heavy items · over 30 kg" },
];

const MAX_IMG = 10 * 1024 * 1024;
const MAX_VIDEO = 60 * 1024 * 1024;

const videoDuration = (file) =>
  new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => reject(new Error("Could not read this video."));
    v.src = URL.createObjectURL(file);
  });

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [images, setImages] = useState([null, null, null]); // File | null
  const [video, setVideo] = useState(null);
  const [variants, setVariants] = useState([emptyVariant()]);
  const [wsOn, setWsOn] = useState(false);
  const [wsMin, setWsMin] = useState("");
  const [wsPrice, setWsPrice] = useState("");
  const [deliveryClass, setDeliveryClass] = useState("");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocs(collection(db, "categories")).then((snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, subcategories: d.data().subcategories || [] })))
    );
  }, []);

  const subOptions = categories.find((c) => c.id === category)?.subcategories || [];

  const pickImage = (i, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > MAX_IMG) return setError("Images must be under 10MB.");
    setError("");
    setImages((p) => p.map((x, idx) => (idx === i ? file : x)));
  };

  const pickVideo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError("Please choose a video file.");
    if (file.size > MAX_VIDEO) return setError("Video must be under 60MB.");
    try {
      const d = await videoDuration(file);
      if (d < 10 || d > 60) return setError("Video must be between 10 and 60 seconds.");
    } catch (e) {
      return setError(e.message);
    }
    setError("");
    setVideo(file);
  };

  const toggleSub = (n) =>
    setSubcategories((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const priceNum = parseFloat(price);
    if (!name.trim() || !priceNum || priceNum <= 0 || !category || subcategories.length === 0 || images.every((i) => !i))
      return setError("Fill all required fields, pick a category and subcategory, and add at least one image.");
    if (wsOn) {
      const q = parseInt(wsMin, 10), wp = parseFloat(wsPrice);
      if (!(q >= 2)) return setError("Wholesale minimum quantity must be 2 or more.");
      if (!(wp > 0) || wp >= priceNum) return setError("The wholesale price must be lower than the normal price.");
    }
    if (!deliveryClass) return setError("Choose a delivery size for this product.");
    const vErr = validateVariants(variants);
    if (vErr) return setError(vErr);

    const user = auth.currentUser;
    if (!user) return setError("You must be logged in.");

    setSaving(true);
    setProgress(0);
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) throw new Error("User profile not found.");
      const u = userSnap.data();
      const currency = u.currency || "GHS";
      const symbol = u.symbol || "₵";

      const productRef = await addDoc(collection(db, "products"), {
        name: name.trim(),
        price: priceNum,
        currency,
        symbol,
        description: description.trim(),
        subcategory: subcategories[0],
        subcategories,
        category,
        deliveryClass,
        wholesale: wsOn ? { minQty: parseInt(wsMin, 10), price: parseFloat(wsPrice) } : null,
        vendorId: user.uid,
        vendorName: u.fullName || "Vendor",
        vendorEmail: u.email || null,
        city: u.city || null,
        region: u.region || null,
        country: u.country || null,
        status: "uploading",
        createdAt: serverTimestamp(),
      });

      const files = images.filter(Boolean);
      const total = files.length + (video ? 1 : 0);
      let done = 0;
      const imageUrls = [];

      for (const [i, file] of files.entries()) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        imageUrls.push(
          await uploadToR2({
            file, kind: "product", vendorId: user.uid, productId: productRef.id,
            fileName: `product-${user.uid}-${Date.now()}-${i}.${ext}`,
          })
        );
        setProgress(++done / total);
      }

      let videoUrl = null;
      if (video) {
        videoUrl = await uploadToR2({
          file: video, kind: "product", vendorId: user.uid, productId: productRef.id,
          fileName: `video-${user.uid}-${Date.now()}.mp4`,
        });
        setProgress(++done / total);
      }

      await updateDoc(productRef, {
        ...buildVariants(variants),
        images: imageUrls,
        video: videoUrl,
        status: "active",
        stockUpdatedAt: serverTimestamp(),
      });

      router.push("/vendor/products");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not add product.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="container-page max-w-2xl space-y-6 py-6">
      <h1 className="text-2xl font-bold text-ink-900">Add product</h1>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Basic info</h2>
        <input className="input" placeholder="Product name *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" type="number" min="0" step="0.01" placeholder="Price (GHS) *" value={price}
          onChange={(e) => setPrice(e.target.value)} />
        <textarea className="input min-h-28" placeholder="Description" value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Images (1–3 required) &amp; optional video</h2>
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <label key={i} className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed text-ink-500">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(img)} alt="" className="h-full w-full object-cover" />
              ) : "+ Image"}
              <input type="file" accept="image/*" hidden onChange={(e) => pickImage(i, e.target.files?.[0])} />
            </label>
          ))}
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed p-3 text-sm text-ink-500">
          <span>{video ? video.name : "+ Video (10–60 seconds, optional)"}</span>
          {video && <button type="button" onClick={(ev) => { ev.preventDefault(); setVideo(null); }} className="text-red-500">Remove</button>}
          <input type="file" accept="video/*" hidden onChange={(e) => pickVideo(e.target.files?.[0])} />
        </label>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Variants (stock per size/color)</h2>
        <VariantEditor variants={variants} setVariants={setVariants} />
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Wholesale (optional)</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={wsOn} onChange={(e) => setWsOn(e.target.checked)} />
          I also sell wholesale. Buyers get a lower price per item when they buy enough.
        </label>
        {wsOn && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" min="2" step="1" placeholder="Minimum quantity (e.g. 10)" value={wsMin}
                onChange={(e) => setWsMin(e.target.value)} />
              <input className="input" type="number" min="0" step="0.01" placeholder="Price per item (GHS)" value={wsPrice}
                onChange={(e) => setWsPrice(e.target.value)} />
            </div>
            {parseInt(wsMin, 10) >= 2 && parseFloat(wsPrice) > 0 && parseFloat(price) > 0 && (
              <p className="text-sm text-ink-500">
                Example: {wsMin} items cost {(parseInt(wsMin, 10) * parseFloat(wsPrice)).toFixed(2)} instead of {(parseInt(wsMin, 10) * parseFloat(price)).toFixed(2)}.
              </p>
            )}
          </>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Delivery size *</h2>
        <p className="text-sm text-ink-500">Pick the size of one item as packed. The delivery fee depends on it.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DELIVERY_CLASSES.map((c) => (
            <button type="button" key={c.key} onClick={() => setDeliveryClass(c.key)}
              className={`rounded-lg border-2 p-3 text-left ${deliveryClass === c.key ? "border-brand-600 bg-brand-50" : "border-gray-200"}`}>
              <span className="block font-semibold">{c.label}</span>
              <span className="block text-xs text-ink-500">{c.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Category *</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button type="button" key={c.id}
              onClick={() => { setCategory(c.id); setSubcategories([]); }}
              className={category === c.id ? "btn-primary" : "btn-outline"}>{c.id}</button>
          ))}
        </div>
        {subOptions.length > 0 && (
          <>
            <p className="text-sm text-ink-500">Subcategories (first selected is the main one)</p>
            <div className="flex flex-wrap gap-2">
              {subOptions.map((s) => (
                <button type="button" key={s.name} onClick={() => toggleSub(s.name)}
                  className={subcategories.includes(s.name) ? "btn-primary" : "btn-outline"}>{s.name}</button>
              ))}
            </div>
          </>
        )}
      </section>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {saving && (
        <div className="h-2 overflow-hidden rounded bg-gray-200">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      <button className="btn-primary w-full" disabled={saving}>
        {saving ? `Uploading… ${Math.round(progress * 100)}%` : "Publish product"}
      </button>
    </form>
  );
}