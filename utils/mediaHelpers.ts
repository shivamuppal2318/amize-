export const sanitizeMediaUri = (uri: string): string => {
    // Handle iOS-specific URI issues (remove fragments after #)
    if (uri.includes('#')) {
        return uri.split('#')[0];
    }
    return uri;
};