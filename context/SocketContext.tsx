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
    let socketState: UseSocketReturn | undefined;
    
    try {
        socketState = useSocket();
    } catch (error) {
        console.error('[SocketContext] Failed to initialize socket:', error);
        // Create a minimal fallback state if socket fails
        socketState = {
            isConnected: false,
            sendMessage: async () => {},
            onMessageReceived: null,
            disconnect: () => {},
        } as UseSocketReturn;
    }

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