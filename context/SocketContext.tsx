import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket, UseSocketReturn } from '@/hooks/useSocket';

interface SocketContextType extends UseSocketReturn {
    // Add any additional socket-related state or methods here
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const socketState = useSocket();

    return (
        <SocketContext.Provider value={socketState}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocketContext = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
};

export default SocketProvider;