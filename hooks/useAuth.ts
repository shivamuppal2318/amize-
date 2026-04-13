import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { isDemoMode } from '@/lib/release/releaseConfig';
import { canUseLocalDemoAuth } from '@/lib/auth/localDemoAuth';

export const useAuth = () => {
    const contextValue = useContext(AuthContext);
    const demoEligible = isDemoMode() || canUseLocalDemoAuth();
    const effectiveIsAuthenticated =
        contextValue.isAuthenticated || !!contextValue.user || (!!contextValue.user && demoEligible);

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
