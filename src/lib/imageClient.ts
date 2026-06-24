"use client";

import imageCompression from "browser-image-compression";

/** Compress + resize an image in the browser before upload to save bandwidth. */
export async function compressImage(file: File, maxDim = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: maxDim,
      maxSizeMB: 1.6,
      useWebWorker: true,
      initialQuality: 0.82,
    });
  } catch {
    return file;
  }
}

/** Upload one or more files; returns their URLs. */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const compressed = await Promise.all(files.map((f) => compressImage(f)));
  const fd = new FormData();
  for (const f of compressed) fd.append("files", f, f.name);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload fehlgeschlagen");
  const data = await res.json();
  return data.urls as string[];
}
