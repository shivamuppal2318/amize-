type ErrorMetadata = {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
};

export function captureException(
    error: unknown,
    metadata?: ErrorMetadata
): void {
    console.error('[ErrorReporting] Captured exception:', error, metadata ?? {});
}
