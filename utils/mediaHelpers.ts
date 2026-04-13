export function sanitizeMediaUri(uri: string): string {
    if (!uri) {
        return '';
    }

    if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')) {
        return uri;
    }

    return `file://${uri}`;
}
