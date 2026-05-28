const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
};

/** Infer MIME when the browser leaves `File.type` empty (common for HEIC / some exports). */
export function inferMimeType(fileName: string, mimeType: string): string {
  const trimmed = mimeType?.trim() ?? "";
  if (trimmed.length > 0) return trimmed;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "";
}
