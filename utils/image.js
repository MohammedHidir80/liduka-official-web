// utils/image.js

// Center-crops to a square, shrinks to at most `size` px, returns a JPEG blob
export async function resizeToSquareJpeg(file, size = 512, quality = 0.85) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read this image. Please try a JPG, PNG or WebP file.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(size, side);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Could not process this image.");
  return blob;
}