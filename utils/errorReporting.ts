// utils/errorReporting.ts
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface ErrorContext {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: {
        id?: string;
        username?: string;
        email?: string;
    };
}

/**
 * Captures and reports exceptions to your error reporting system
 * This is a placeholder implementation - you would typically integrate
 * with services like Sentry, Bugsnag, etc.
 */
export const captureException = (
    error: Error | string,
    context?: ErrorContext
) => {
    // Convert string errors to Error objects for consistency
    const errorObject = typeof error === 'string' ? new Error(error) : error;

    // Log to console during development
    if (__DEV__) {
        console.error('ERROR CAPTURED:', errorObject);

        if (context) {
            console.error('ERROR CONTEXT:', {
                tags: context.tags || {},
                extras: context.extra || {},
                user: context.user || {}
            });
        }

        // Log stack trace if available
        if (errorObject.stack) {
            console.error('STACK TRACE:', errorObject.stack);
        }

        return;
    }

    // For production, you would send to an error reporting service
    // This is where you would integrate with Sentry, Bugsnag, etc.

    // Example for Sentry integration:
    // Sentry.captureException(errorObject, {
    //   tags: context?.tags,
    //   extra: {
    //     ...context?.extra,
    //     deviceInfo: getDeviceInfo(),
    //   },
    //   user: context?.user,
    // });

    // Example without an actual service, collect the error data
    // that would be sent in production
    const errorReport = {
        error: {
            name: errorObject.name,
            message: errorObject.message,
            stack: errorObject.stack,
        },
        context: context || {},
        device: getDeviceInfo(),
        timestamp: new Date().toISOString(),
    };

    // In production, you would send this report to your backend or error service
    // For now, just log that we captured it
    console.log('Error report prepared for production:', errorReport);
};

/**
 * Reports a warning (non-critical issue)
 */
export const reportWarning = (
    message: string,
    context?: ErrorContext
) => {
    // During development, just log to console
    if (__DEV__) {
        console.warn('WARNING:', message);

        if (context) {
            console.warn('WARNING CONTEXT:', context);
        }

        return;
    }

    // For production, you would log warnings similar to errors but with lower severity
    // Example for Sentry integration:
    // Sentry.captureMessage(message, {
    //   level: 'warning',
    //   tags: context?.tags,
    //   extra: {
    //     ...context?.extra,
    //     deviceInfo: getDeviceInfo(),
    //   },
    //   user: context?.user,
    // });
};

/**
 * Gets device information for error context
 */
const getDeviceInfo = () => {
    return {
        appVersion: Application.nativeApplicationVersion || 'unknown',
        buildVersion: Application.nativeBuildVersion || 'unknown',
        deviceName: Device.deviceName || 'unknown',
        deviceYearClass: Device.deviceYearClass || 'unknown',
        deviceType: Device.deviceType,
        osName: Device.osName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
        platform: Platform.OS,
        release: Platform.Version,
        brand: Device.brand || 'unknown',
        model: Device.modelName || 'unknown',
        isDevice: Device.isDevice,
        expoVersion: Constants.expoVersion,
    };
};

/**
 * Sets the current user information for error reports
 * Call this after user login/logout to associate errors with users
 */
export const setUserContext = (
    user: { id?: string; username?: string; email?: string } | null
) => {
    // With a real error reporting service, you would set the user here
    // Example for Sentry integration:
    // if (user) {
    //   Sentry.setUser({
    //     id: user.id,
    //     username: user.username,
    //     email: user.email,
    //   });
    // } else {
    //   Sentry.setUser(null);
    // }

    // Log that user context was set
    if (__DEV__) {
        console.log('User context for error reporting:', user || 'cleared');
    }
};

/**
 * Initialize error reporting service
 * Call this in your app's entry point
 */
export const initErrorReporting = () => {
    // This is where you would initialize your error reporting service
    // Example for Sentry integration:
    // Sentry.init({
    //   dsn: 'your-sentry-dsn',
    //   enableAutoSessionTracking: true,
    //   tracesSampleRate: 1.0,
    //   debug: __DEV__,
    //   environment: __DEV__ ? 'development' : 'production',
    // });

    // Set up global error handler for unhandled JS errors
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
        // Capture the error
        captureException(error, {
            tags: { fatal: isFatal ? 'yes' : 'no' }
        });

        // Call the original handler
        originalHandler(error, isFatal);
    });

    // Log initialization
    if (__DEV__) {
        console.log('Error reporting initialized');
    }
};