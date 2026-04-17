import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';

export const useAuth = () => {
    const contextValue = useContext(AuthContext);
    const effectiveIsAuthenticated = contextValue.isAuthenticated;

    // Add debugging for development
    useEffect(() => {
        //TODO
    }, [
        contextValue.isAuthenticated,
        contextValue.hasCompletedOnboarding,
        contextValue.loading,
        contextValue.isInSignupFlow
    ]);

    return {
        ...contextValue,
        isAuthenticated: effectiveIsAuthenticated,
    };
};
