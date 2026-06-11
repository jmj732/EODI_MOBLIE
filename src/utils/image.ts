import { apiBaseUrl } from "@/config/env";

export function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${apiBaseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function isSupportedImageName(fileName: string) {
  return /\.(jpe?g|png|gif|webp)$/i.test(fileName);
}

export function isAllowedImageSize(bytes: number) {
  return bytes <= 10 * 1024 * 1024;
}
