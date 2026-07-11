import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    receivedAt: string;
    read: boolean;
    data?: Record<string, unknown>;
}

interface NotificationsContextData {
    notifications: AppNotification[];
    unreadCount: number;
    addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'receivedAt'>) => void;
    markAllRead: () => void;
}

const NotificationsContext = createContext({} as NotificationsContextData);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        setNotifications([]);
    }, [user?.id]);

    const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read' | 'receivedAt'>) => {
        setNotifications((prev) => [
            {
                ...n,
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                read: false,
                receivedAt: new Date().toISOString(),
            },
            ...prev,
        ]);
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    return useContext(NotificationsContext);
}
