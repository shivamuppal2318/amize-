import { API_URL, SERVER_URL } from "@/lib/settings/constants";

const DEFAULT_MEDIA_BASE_URL = (() => {
  const api = String(API_URL || "").replace(/\/+$/, "");
  const withoutApiSuffix = api.replace(/\/api$/i, "");
  return withoutApiSuffix || String(SERVER_URL || "").replace(/\/+$/, "");
})();

const FALLBACK_VIDEO_URLS = [
  "https://videos.pexels.com/video-files/6646665/6646665-hd_1080_1920_24fps.mp4",
  "https://videos.pexels.com/video-files/6624853/6624853-uhd_1440_2560_30fps.mp4",
  "https://videos.pexels.com/video-files/8344235/8344235-uhd_1440_2560_25fps.mp4",
  "https://videos.pexels.com/video-files/3099415/3099415-uhd_2560_1440_30fps.mp4",
  "https://videos.pexels.com/video-files/7247861/7247861-hd_1080_1920_30fps.mp4",
];

const FALLBACK_POSTER_URLS = [
  "https://images.pexels.com/photos/31313204/pexels-photo-31313204/free-photo-of-charming-narrow-street-in-gorlitz-germany.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/30910224/pexels-photo-30910224/free-photo-of-delicious-chocolate-cake-with-pistachios.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  "https://images.pexels.com/photos/31085625/pexels-photo-31085625/free-photo-of-small-bird-perched-on-wire-against-soft-background.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/29957631/pexels-photo-29957631/free-photo-of-serene-evening-coffee-in-golden-light.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  "https://images.pexels.com/photos/31249687/pexels-photo-31249687/free-photo-of-elegant-coffee-and-dessert-display-in-cafe.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
];

const pickFallbackBySeed = (seed: string, values: string[]) => {
  const normalized = seed || "0";
  const total = normalized
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return values[total % values.length];
};

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
    try {
      const parsed = new URL(value);
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "0.0.0.0"
      ) {
        const normalizedBase = String(baseUrl || "").replace(/\/+$/, "");
        if (normalizedBase) {
          return `${normalizedBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      }
    } catch {
      // Ignore parsing issues and return the original value below.
    }

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

export function isPlaceholderMediaUri(uri?: string | null): boolean {
  if (!uri) return true;

  const value = String(uri).trim().toLowerCase();
  if (!value) return true;

  return (
    value.includes("example.com/videos") ||
    value.includes("example.com/thumbnails") ||
    value.includes("example.com/sounds") ||
    value.includes("via.placeholder.com") ||
    value === "null" ||
    value === "undefined"
  );
}

export function getSafeVideoUri(
  uri?: string | null,
  seed: string = "0",
  baseUrl: string = DEFAULT_MEDIA_BASE_URL
): string {
  const resolved = resolveRemoteMediaUri(uri, baseUrl);

  if (!resolved || isPlaceholderMediaUri(resolved)) {
    return pickFallbackBySeed(seed, FALLBACK_VIDEO_URLS);
  }

  return resolved;
}

export function getSafePosterUri(
  uri?: string | null,
  seed: string = "0",
  baseUrl: string = DEFAULT_MEDIA_BASE_URL
): string {
  const resolved = resolveRemoteMediaUri(uri, baseUrl);

  if (!resolved || isPlaceholderMediaUri(resolved)) {
    return pickFallbackBySeed(seed, FALLBACK_POSTER_URLS);
  }

  return resolved;
}
