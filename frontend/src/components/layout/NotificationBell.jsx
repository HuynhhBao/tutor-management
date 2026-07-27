import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

export default function NotificationBell() {
    const socket = useSocket();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data) => {
            toast.success(`${data.title}: ${data.message}`, {
                duration: 5000,
                position: 'top-right',
            });
            setUnreadCount(prev => prev + 1);
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    const handleBellClick = () => {
        // Reset unread count when clicking bell.
        // In a real app, this would open a dropdown and call an API to mark as read.
        setUnreadCount(0);
    };

    return (
        <button 
            type="button"
            onClick={handleBellClick}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}
