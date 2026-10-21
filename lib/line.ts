export function resolveLineUrl(lineUrl: string, lineId: string): string {
  const url = lineUrl.trim();
  if (url) {
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("line.me")) return `https://${url}`;
  }
  const id = lineId.trim().replace(/^@/, "");
  if (!id) return "";
  if (lineId.trim().startsWith("@")) {
    return `https://line.me/R/ti/p/@${id}`;
  }
  return `https://line.me/ti/p/~${id}`;
}

export function lineLoginEnabled(): boolean {
  return Boolean(process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET);
}
