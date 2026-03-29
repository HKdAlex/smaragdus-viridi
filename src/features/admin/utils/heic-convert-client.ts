/**
 * Client-side HEIC/HEIF detection and conversion using `heic-convert/browser`
 * (Canvas-based JPEG encoding; suitable for admin uploads only).
 */

const HEIC_HEIF_EXT = /\.(heic|heif)$/i;

const HEIC_HEIF_MIMES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export function isHeicOrHeifFile(file: File): boolean {
  if (HEIC_HEIF_EXT.test(file.name)) return true;
  return HEIC_HEIF_MIMES.has(file.type.toLowerCase());
}

/** Treat as image for dropzone filtering when MIME is empty (some HEIC sources). */
export function isImageUploadCandidate(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return isHeicOrHeifFile(file);
}

type HeicConvertFn = (opts: {
  buffer: ArrayBuffer | Uint8Array;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<Uint8Array>;

export async function convertHeicFileToJpeg(file: File): Promise<File> {
  const mod = await import("heic-convert/browser");
  const convert = mod.default as HeicConvertFn;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const out = await convert({
    buffer,
    format: "JPEG",
    quality: 0.92,
  });
  const baseName = file.name.replace(HEIC_HEIF_EXT, "") || "image";
  const jpegBytes = new Uint8Array(out);
  return new File([jpegBytes], `${baseName}.jpg`, { type: "image/jpeg" });
}

export async function prepareImageFilesForUpload(files: File[]): Promise<File[]> {
  const result: File[] = [];
  for (const file of files) {
    if (isHeicOrHeifFile(file)) {
      result.push(await convertHeicFileToJpeg(file));
    } else {
      result.push(file);
    }
  }
  return result;
}
