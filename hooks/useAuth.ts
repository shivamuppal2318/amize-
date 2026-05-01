import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export const useAuth = () => {
    const contextValue = useContext(AuthContext);
    const effectiveIsAuthenticated = contextValue.isAuthenticated;

    return {
        ...contextValue,
        isAuthenticated: effectiveIsAuthenticated,
    };
};
