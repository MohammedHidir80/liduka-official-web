// lib/r2.js
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";

const getSignedUploadUrl = httpsCallable(functions, "getSignedUploadUrl");

// XHR instead of fetch, because fetch can't report upload progress
function putFile(url, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType); // must match what was signed

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () =>
      reject(
        new Error(
          "Upload failed. Check your connection. If it keeps failing, the storage bucket may not allow uploads from this site."
        )
      );
    xhr.send(file);
  });
}

// kind: "avatar" | "product". Resolves with the public URL.
export async function uploadToR2({ file, fileName, kind = "product", vendorId, productId, onProgress }) {
  if (!auth.currentUser) throw new Error("User not authenticated");

  const contentType = file.type || "application/octet-stream";
  const res = await getSignedUploadUrl({ kind, fileName, fileType: contentType, vendorId, productId });
  const { uploadUrl, publicUrl } = res.data;

  await putFile(uploadUrl, file, contentType, onProgress);
  return publicUrl;
}

export const uploadAvatar = (blob, uid, onProgress) =>
  uploadToR2({
    file: blob,
    kind: "avatar",
    fileName: `avatar-${uid}-${Date.now()}.jpg`, // unique name per upload
    onProgress,
  });