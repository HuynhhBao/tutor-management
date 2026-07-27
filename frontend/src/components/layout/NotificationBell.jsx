import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, Check, BellOff, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

export default function NotificationBell() {
    const { socket } = useSocket() || {};
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Tính toán số lượng thông báo chưa đọc
    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Tải danh sách thông báo từ Server
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/notifications`, {
                credentials: 'include',
            });
            if (res.ok) {
                const json = await res.json();
                setNotifications(json.data || []);
            }
        } catch (err) {
            console.error('Lỗi khi tải thông báo:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Lắng nghe socket sự kiện tin nhắn thời gian thực
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data) => {
            toast.success(`${data.title}: ${data.message}`, {
                duration: 5000,
                position: 'top-right',
                icon: '🔔',
                style: {
                    borderRadius: '16px',
                    background: '#1E293B',
                    color: '#F8FAFC',
                    padding: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }
            });
            // Tải lại danh sách từ DB để cập nhật ID thật và timestamp
            fetchNotifications();
        };

        socket.on('new_notification', handleNewNotification);
        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    // Bắt sự kiện click ra ngoài để đóng Menu Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(prev => !prev);
    };

    // Đánh dấu 1 thông báo là đã đọc và điều hướng trang
    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await fetch(`${API_BASE}/notifications/${notif.id}/read`, {
                    method: 'PUT',
                    credentials: 'include',
                });
                setNotifications(prev => 
                    prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
                );
            } catch (err) {
                console.error('Lỗi cập nhật đã đọc:', err);
            }
        }
        setIsOpen(false);

        // Điều hướng thông minh dựa vào URL hiện tại và nội dung
        const path = location.pathname;
        if (path.startsWith('/tutor-dashboard')) {
            navigate('/tutor-dashboard');
        } else if (path.startsWith('/student-dashboard')) {
            navigate('/student-dashboard/schedule');
        } else if (path.startsWith('/admin')) {
            navigate('/admin/bookings');
        }
    };

    // Đánh dấu tất cả là đã đọc
    const handleMarkAllAsRead = async (e) => {
        e.stopPropagation();
        try {
            await fetch(`${API_BASE}/notifications/read-all`, {
                method: 'PUT',
                credentials: 'include',
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            toast.success('Đã đọc tất cả thông báo');
        } catch (err) {
            console.error('Lỗi khi đánh dấu tất cả:', err);
        }
    };

    // Helper: Chuyển Timestamp thành thời gian dạng tương đối
    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'Vừa xong';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Vừa xong';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                type="button"
                onClick={handleBellClick}
                className="relative p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all active:scale-95"
                title="Thông báo"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold px-1 animate-pulse shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                            <h3 className="font-extrabold text-base tracking-wide">Thông Báo Của Bạn</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-500/20 text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-slate-300 hover:text-white hover:underline transition-colors flex items-center gap-1 font-semibold"
                                title="Đánh dấu tất cả là đã đọc"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                Đã đọc hết
                            </button>
                        )}
                    </div>

                    {/* Content List */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                        {loading && notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                                <p className="text-xs font-semibold">Đang tải thông báo...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 px-6 flex flex-col items-center justify-center text-center text-slate-500">
                                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                                    <BellOff className="w-7 h-7" />
                                </div>
                                <p className="font-bold text-slate-700 mb-1">Hộp thư thông báo trống!</p>
                                <p className="text-xs text-slate-500">Khi có hoạt động mới về lịch học hoặc cập nhật, hệ thống sẽ thông báo tại đây.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 transition-all cursor-pointer hover:bg-slate-100/80 flex items-start space-x-3.5 ${
                                        !notif.is_read 
                                            ? 'bg-blue-50/70 border-l-4 border-l-blue-500' 
                                            : 'bg-white opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`text-sm truncate pr-2 ${!notif.is_read ? 'font-extrabold text-blue-950' : 'font-semibold text-slate-700'}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[11px] font-semibold text-slate-400 flex items-center flex-shrink-0 gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {formatRelativeTime(notif.created_at)}
                                            </span>
                                        </div>
                                        <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.is_read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                            {notif.message}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 self-center">
                                        {!notif.is_read ? (
                                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full block shadow-sm shadow-blue-500/50"></span>
                                        ) : (
                                            <Check className="w-4 h-4 text-slate-300" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
