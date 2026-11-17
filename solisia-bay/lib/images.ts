const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as const;

export type ImageKind = keyof typeof TYPES;

export function imageContentType(kind: ImageKind): string {
  return TYPES[kind];
}

/** Magic-byte sniff. SVG, HTML and mismatched extensions are rejected. */
export function sniffImage(buf: Buffer): ImageKind | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "png";
  if (buf.length > 6 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a")) return "gif";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export function safeUploadName(kind: ImageKind, id: string): string {
  const ext = kind === "jpg" ? "jpg" : kind;
  return `${id}.${ext}`;
}
