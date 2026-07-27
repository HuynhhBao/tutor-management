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
            // Use environment variable for backend URL to avoid SonarCloud security hotspot for hardcoded URIs
            // If VITE_API_URL is 'http://localhost:3001/api', we take 'http://localhost:3001'
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const backendUrl = apiUrl.replace('/api', '');
            
            newSocket = io(backendUrl);
            
            newSocket.on('connect', () => {
                newSocket.emit('authenticate', { userId: user.id, role: user.role });
            });
            
            newSocket.on('disconnect', () => {
                // socket disconnected
            });
            
            setSocket({ socket: newSocket });
        }

        return () => {
            if (newSocket) {
                newSocket.disconnect();
                setSocket(null);
            }
        };
    }, [user]);

    // Provide the socket inside an object matching how NotificationBell uses it: const { socket } = useSocket() || {};
    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
