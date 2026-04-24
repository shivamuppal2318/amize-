import { API_URL, SERVER_URL } from "@/lib/settings/constants";

const DEFAULT_MEDIA_BASE_URL = (() => {
  const api = String(API_URL || "").replace(/\/+$/, "");
  const withoutApiSuffix = api.replace(/\/api$/i, "");
  return withoutApiSuffix || String(SERVER_URL || "").replace(/\/+$/, "");
})();

export function sanitizeMediaUri(uri: string): string {
    if (!uri) {
        return '';
    }

    if (
        uri.startsWith('file://') ||
        uri.startsWith('content://') ||
        uri.startsWith('http') ||
        uri.startsWith('blob:') ||
        uri.startsWith('data:') ||
        uri.startsWith('ph://') ||
        uri.startsWith('assets-library://')
    ) {
        return uri;
    }

    return `file://${uri}`;
}

/**
 * Resolve a remote media path (e.g. "/uploads/x.mp4") into an absolute URL.
 * Intended for URLs coming from the API, not local filesystem paths.
 */
export function resolveRemoteMediaUri(
  uri?: string | null,
  baseUrl: string = DEFAULT_MEDIA_BASE_URL
): string {
  if (!uri) return "";

  const value = String(uri).trim();
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("file://") ||
    value.startsWith("content://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:") ||
    value.startsWith("ph://") ||
    value.startsWith("assets-library://")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  const base = String(baseUrl || "").replace(/\/+$/, "");
  if (!base) return value;

  if (value.startsWith("/")) {
    return `${base}${value}`;
  }

  // Handle URLs missing scheme: "example.com/path"
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(value)) {
    return `https://${value}`;
  }

  return `${base}/${value.replace(/^\/+/, "")}`;
}
