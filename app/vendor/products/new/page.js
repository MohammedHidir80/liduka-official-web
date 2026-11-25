"use client";
// app/vendor/products/new/page.js — step-by-step add product (same steps and look as the mobile app).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, updateDoc, getDoc, getDocs, collection, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { uploadToR2 } from "@/lib/r2";
import { buildVariants, emptyVariant, validateVariants } from "@/lib/vendorProducts";

// Delivery size decides the delivery fee. Keep these keys in sync with the mobile app and the delivery pricing settings.
const DELIVERY_CLASSES = [
  { key: "small", label: "Small", hint: "Phone, shoes, clothes · under 2 kg" },
  { key: "medium", label: "Medium", hint: "Blender, small TV, box of goods · 2–10 kg" },
  { key: "large", label: "Large", hint: "Microwave, big TV, mattress · 10–30 kg" },
  { key: "heavy", label: "Heavy", hint: "Fridge, sofa, heavy items · over 30 kg" },
];
const STEPS = ["Basic Info", "Media", "Stock", "Review"];
const MAX_IMG = 10 * 1024 * 1024;
const MAX_VIDEO = 150 * 1024 * 1024;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|3gp|mkv)$/i;

const videoDuration = (file) =>
  new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => reject(new Error("Could not read this video."));
    v.src = URL.createObjectURL(file);
  });

// preview of a chosen file (created once, cleaned up)
function Thumb({ file, className = "" }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) return setUrl("");
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className={className} /> : null;
}

const Label = ({ children }) => (
  <p className="mb-1.5 mt-4 text-xs font-extrabold uppercase tracking-wide text-ink-500">{children}</p>
);
const Chip = ({ on, onClick, children }) => (
  <button type="button" onClick={onClick}
    className={`rounded-full border px-3.5 py-2 text-xs font-bold ${on ? "border-brand-600 bg-brand-600 text-white" : "border-ink-100 bg-white text-ink-900"}`}>
    {children}
  </button>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3 px-3 py-2.5 text-sm">
    <span className="text-ink-500">{label}</span>
    <span className="truncate text-right font-bold text-ink-900">{value}</span>
  </div>
);

export default function AddProductPage() {
  const router = useRouter();
  const { user: me } = useAuth();
  const cur = me?.symbol || me?.currency || "";

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [images, setImages] = useState([]); // File[] max 3
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
  const subName = (s) => (typeof s === "string" ? s : s.name);
  const totalStock = variants.reduce((s, v) => s + (parseInt(v.stock, 10) || 0), 0);
  const setV = (i, k, val) => setVariants((p) => p.map((v, j) => (j === i ? { ...v, [k]: val } : v)));
  const toggleSub = (n) => setSubcategories((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const addImages = (files) => {
    setError("");
    const ok = [];
    for (const f of Array.from(files || [])) {
      if (!f.type.startsWith("image/")) { setError("Please choose image files only."); continue; }
      if (f.size > MAX_IMG) { setError("Images must be under 10MB."); continue; }
      ok.push(f);
    }
    setImages((p) => [...p, ...ok].slice(0, 3));
  };

  const pickVideo = async (file) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("video/") && !VIDEO_EXT.test(file.name || "")) return setError("Please choose a video file.");
    if (file.size > MAX_VIDEO) return setError("Video must be under 150MB.");
    try {
      const d = await videoDuration(file);
      if (d < 10 || d > 60) return setError("Video must be between 10 and 60 seconds.");
    } catch { /* some phone formats can't be read by the browser: accept it */ }
    setVideo(file);
  };

  // returns an error message, or "" when the step is fine
  const check = (s) => {
    if (s === 1) {
      if (!name.trim()) return "Product name is required.";
      if (!(parseFloat(price) > 0)) return "Enter a valid price.";
      if (!category) return "Choose a category.";
      if (subcategories.length === 0) return "Choose at least one subcategory.";
    }
    if (s === 2 && images.length === 0) return "Add at least one product image.";
    if (s === 3) {
      if (wsOn) {
        const q = parseInt(wsMin, 10), wp = parseFloat(wsPrice);
        if (!(q >= 2)) return "Wholesale minimum quantity must be 2 or more.";
        if (!(wp > 0) || wp >= parseFloat(price)) return "The wholesale price must be lower than the normal price.";
      }
      if (!deliveryClass) return "Choose the delivery size. It sets the delivery fee.";
      if (variants.some((v) => v.stock === "" || v.stock == null)) return "Enter the stock for every variant.";
      const vErr = validateVariants(variants);
      if (vErr) return vErr;
    }
    return "";
  };

  const go = (n) => { setError(""); setStep(n); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => { const e = check(step); if (e) return setError(e); go(step + 1); };
  const back = () => (saving ? null : step === 1 ? router.back() : go(step - 1));

  const submit = async () => {
    for (const s of [1, 2, 3]) { const e = check(s); if (e) { setError(e); return setStep(s); } }
    const user = auth.currentUser;
    if (!user) return setError("You must be logged in.");

    setSaving(true); setProgress(0); setError("");
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) throw new Error("User profile not found.");
      const u = userSnap.data();
      // Currency and country come from the account (set by the server from the IP), never guessed.
      if (!u.currency || !u.symbol || !u.countryCode)
        throw new Error("Your account's country isn't set up yet. Please log out and log in again, or contact support.");

      const productRef = await addDoc(collection(db, "products"), {
        name: name.trim(),
        price: parseFloat(price),
        currency: u.currency,
        symbol: u.symbol,
        shipsInternationally: !!u.shipsInternationally,
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
        countryCode: u.countryCode || null,
        status: "uploading",
        createdAt: serverTimestamp(),
      });

      const total = images.length + (video ? 1 : 0);
      let done = 0;
      const imageUrls = [];
      for (const [i, file] of images.entries()) {
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

  const last = STEPS.length;
  const dClass = DELIVERY_CLASSES.find((c) => c.key === deliveryClass)?.label || "—";

  return (
    <div className="container-page max-w-2xl pb-28 pt-4">
      {/* header */}
      <div className="flex items-center justify-between border-b border-ink-100 pb-3">
        <button onClick={back} disabled={saving} className="grid h-9 w-9 place-items-center rounded-xl text-xl text-ink-900 hover:bg-ink-100" aria-label="Back">←</button>
        <h1 className="text-[17px] font-extrabold text-ink-900">Add Product</h1>
        <button type="button" onClick={step === last ? submit : next} disabled={saving}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-70">
          {saving ? `${Math.round(progress * 100)}%` : step === last ? "Publish" : "Next"}
        </button>
      </div>

      {/* progress */}
      <div className="mb-1.5 mt-4 flex justify-between text-xs font-bold">
        <span className="text-ink-500">Step {step} of {last}</span>
        <span className="font-extrabold text-brand-600">{STEPS[step - 1]}</span>
      </div>
      <div className="mb-5 h-1 overflow-hidden rounded bg-ink-100">
        <div className="h-full rounded bg-brand-600 transition-all" style={{ width: `${(step / last) * 100}%` }} />
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <Label>Product Name *</Label>
          <input className="input" placeholder="e.g. Premium Cotton T-Shirt" value={name} onChange={(e) => setName(e.target.value)} />
          <Label>Description</Label>
          <textarea className="input min-h-24" placeholder="Describe your product..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <Label>{`Price (${cur}) *`}</Label>
          <input className="input" inputMode="decimal" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} />
          <Label>Category *</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c.id} on={category === c.id} onClick={() => { setCategory(c.id); setSubcategories([]); }}>{c.id}</Chip>
            ))}
          </div>
          {!!category && (
            <>
              <Label>Subcategories * (pick one or more)</Label>
              {subOptions.length === 0 ? (
                <p className="text-sm text-ink-500">No subcategories yet for this category.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subOptions.map((s) => (
                    <Chip key={subName(s)} on={subcategories.includes(subName(s))} onClick={() => toggleSub(subName(s))}>{subName(s)}</Chip>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <p className="mb-4 text-sm text-ink-500">Add up to 3 images. The first image is the main product photo.</p>
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {images.map((f, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
                <Thumb file={f} className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-sm text-white" aria-label="Remove image">×</button>
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[9px] font-black text-white">MAIN</span>}
              </div>
            ))}
            {images.length < 3 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-100 bg-white">
                <span className="text-3xl leading-none text-brand-600">+</span>
                <span className="mt-1 text-[11px] text-ink-500">Add Image</span>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>

          <Label>Video (optional, 10–60s)</Label>
          {video ? (
            <div className="flex items-center rounded-xl border border-brand-600 bg-white p-3.5">
              <span className="text-2xl text-brand-600">▶</span>
              <span className="ml-2.5 flex-1 truncate font-bold text-ink-900">{video.name || "Video added"}</span>
              <button type="button" onClick={() => setVideo(null)} className="text-xl text-red-500" aria-label="Remove video">×</button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center rounded-xl border border-dashed border-ink-100 bg-white p-3.5">
              <span className="text-xl text-brand-600">🎥</span>
              <span className="ml-2.5 font-bold text-ink-900">Pick a video from device</span>
              <input type="file" accept="video/*" className="sr-only" onChange={(e) => { pickVideo(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          )}
          <div className="mt-4 rounded-xl border border-brand-600/30 bg-brand-50 p-3 text-xs text-ink-900">
            A short video shows up in Reels and helps your product sell.
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <p className="mb-3 text-sm text-ink-500">Add each size / colour you sell with its stock. Leave size and colour empty if the product has none.</p>
          {variants.map((v, i) => (
            <div key={i} className="mb-2.5 rounded-xl border border-ink-100 bg-white p-3">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-extrabold text-ink-900">Variant {i + 1}</span>
                {variants.length > 1 && (
                  <button type="button" onClick={() => setVariants((p) => p.filter((_, j) => j !== i))} className="text-xl text-red-500" aria-label="Remove variant">×</button>
                )}
              </div>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <input className="input" placeholder="Size (M, L…)" value={v.size || ""} onChange={(e) => setV(i, "size", e.target.value)} />
                <input className="input" placeholder="Colour" value={v.color || ""} onChange={(e) => setV(i, "color", e.target.value)} />
              </div>
              <input className="input" inputMode="numeric" placeholder="Stock quantity *" value={v.stock ?? ""} onChange={(e) => setV(i, "stock", e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
          ))}
          <button type="button" onClick={() => setVariants((p) => [...p, emptyVariant()])}
            className="flex w-full items-center justify-center gap-1 rounded-xl bg-brand-50 py-3 text-xs font-extrabold text-brand-600">+ Add Variant</button>
          <p className="mt-3 text-center text-xs text-ink-500">Total stock: <b className="text-ink-900">{totalStock}</b></p>

          <Label>Wholesale (optional)</Label>
          <button type="button" onClick={() => setWsOn(!wsOn)}
            className={`flex w-full items-center rounded-xl border-[1.5px] p-3 text-left ${wsOn ? "border-brand-600 bg-brand-50" : "border-ink-100 bg-white"}`}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-xs ${wsOn ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300"}`}>{wsOn ? "✓" : ""}</span>
            <span className="ml-2.5 flex-1">
              <span className="block text-sm font-extrabold text-ink-900">I also sell wholesale</span>
              <span className="mt-0.5 block text-xs text-ink-500">Buyers get a lower price per item when they buy enough.</span>
            </span>
          </button>
          {wsOn && (
            <>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input className="input" inputMode="numeric" placeholder="Min quantity (e.g. 10)" value={wsMin} onChange={(e) => setWsMin(e.target.value.replace(/[^0-9]/g, ""))} />
                <input className="input" inputMode="decimal" placeholder="Price per item" value={wsPrice} onChange={(e) => setWsPrice(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
              {parseInt(wsMin, 10) >= 2 && parseFloat(wsPrice) > 0 && parseFloat(price) > 0 && (
                <p className="mt-2 text-xs text-ink-500">
                  Example: {wsMin} items cost {cur}{(parseInt(wsMin, 10) * parseFloat(wsPrice)).toFixed(2)} instead of {cur}{(parseInt(wsMin, 10) * parseFloat(price)).toFixed(2)}.
                </p>
              )}
            </>
          )}

          <Label>Delivery size *</Label>
          <p className="mb-2.5 text-xs text-ink-500">Pick the size of ONE item as packed. The delivery fee depends on it, and riders can check it at pickup.</p>
          {DELIVERY_CLASSES.map((c) => {
            const on = deliveryClass === c.key;
            return (
              <button type="button" key={c.key} onClick={() => setDeliveryClass(c.key)}
                className={`mb-2 flex w-full items-center rounded-xl border-[1.5px] p-3 text-left ${on ? "border-brand-600 bg-brand-50" : "border-ink-100 bg-white"}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-brand-600" : "border-ink-300"}`}>
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                </span>
                <span className="ml-2.5 flex-1">
                  <span className="block text-sm font-extrabold text-ink-900">{c.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{c.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div>
          <h2 className="mb-4 text-lg font-extrabold text-ink-900">Review Your Product</h2>
          <div className="mb-4 overflow-hidden rounded-2xl border border-ink-100 bg-white">
            {images[0] && <Thumb file={images[0]} className="h-44 w-full object-cover" />}
            <div className="p-3.5">
              <p className="text-[11px] font-bold uppercase text-ink-500">{category}{subcategories.length ? ` · ${subcategories.join(", ")}` : ""}</p>
              <p className="mt-1 text-lg font-black text-ink-900">{name}</p>
              <p className="mt-1.5 text-xl font-black text-brand-600">{cur}{parseFloat(price || 0).toFixed(2)}</p>
              <p className="mt-1 text-xs text-ink-500">Stock: {totalStock}{totalStock < 10 ? "  ⚠️ low" : ""}</p>
              {!!description && <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-ink-500">{description}</p>}
            </div>
          </div>
          <div className="mb-3 rounded-xl border border-ink-100 bg-white p-1 divide-y divide-ink-50">
            <Row label="Images" value={`${images.length} image${images.length !== 1 ? "s" : ""}`} />
            <Row label="Video" value={video ? "Yes" : "None"} />
            <Row label="Wholesale" value={wsOn ? `${wsMin}+ at ${cur}${wsPrice}` : "No"} />
            <Row label="Delivery size" value={dClass} />
            <Row label="Variants" value={variants.map((v) => [v.color, v.size].filter(Boolean).join(" ") || "Standard").join(", ")} />
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-100 p-3 text-xs font-semibold text-amber-900">
            ✨ Once confirmed, this product goes live immediately in your storefront.
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {/* bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white p-4">
        <div className="mx-auto flex max-w-2xl gap-2.5">
          {step > 1 && (
            <button type="button" onClick={back} disabled={saving} className="rounded-xl border border-ink-100 px-5 py-3.5 font-extrabold text-ink-900">Back</button>
          )}
          <button type="button" onClick={step === last ? submit : next} disabled={saving}
            className="flex flex-1 items-center justify-center rounded-xl bg-brand-600 py-3.5 text-[15px] font-black text-white disabled:opacity-70">
            {saving ? `Saving… ${Math.round(progress * 100)}%` : step === last ? "Publish Product ✓" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}