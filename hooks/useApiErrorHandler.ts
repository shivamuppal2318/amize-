import { useEffect } from 'react';
import { useErrorContext } from '@/context/ErrorContext';
import { setErrorHandler } from '@/lib/api/client';

/**
 * Hook to set up API error handler integration with ErrorContext
 * This should be called once at the root level of the app
 */
export const useApiErrorHandler = () => {
    const {
        showError,
        showNetworkError,
        showServerError,
        showAuthError
    } = useErrorContext();

    useEffect(() => {
        // Set up the error handler for the API client
        setErrorHandler({
            showError,
            showNetworkError,
            showServerError,
            showAuthError,
        });

        console.log('[useApiErrorHandler] API error handler connected to ErrorContext');

        // No cleanup needed as the error handler reference is global
    }, [showError, showNetworkError, showServerError, showAuthError]);
};