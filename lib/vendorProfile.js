import { uploadToR2 } from "@/lib/r2";
import { resizeToSquareJpeg } from "@/utils/image";

// 16:9 center-crop, max 1280px wide
async function resizeToCoverJpeg(file, width = 1280, quality = 0.85) {
  let bmp;
  try { bmp = await createImageBitmap(file); }
  catch { throw new Error("Could not read this image. Please try a JPG, PNG or WebP file."); }

  const ratio = 16 / 9;
  let sw = bmp.width, sh = bmp.width / ratio;
  if (sh > bmp.height) { sh = bmp.height; sw = sh * ratio; }
  const sx = (bmp.width - sw) / 2, sy = (bmp.height - sh) / 2;
  const w = Math.min(width, Math.round(sw));
  const h = Math.round(w / ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
  if (!blob) throw new Error("Could not process this image.");
  return blob;
}

// type: "avatar" | "cover" -> returns public URL
export async function uploadVendorImage(file, type, uid) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB.");
  const blob = type === "avatar" ? await resizeToSquareJpeg(file, 512) : await resizeToCoverJpeg(file);
  return uploadToR2({ file: blob, kind: "avatar", fileName: `${type}-${uid}-${Date.now()}.jpg` });
}