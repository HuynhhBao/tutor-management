import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    
    useEffect(() => {
        let newSocket;
        
        if (user) {
            newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
            
            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('authenticate', { userId: user.id, role: user.role });
            });
            
            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });
            
            setSocket(newSocket);
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [user]);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
