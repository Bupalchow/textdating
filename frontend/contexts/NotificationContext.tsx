import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: 'new_response' | 'new_match' | 'new_message';
  title: string;
  message: string;
  data: any;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  isLoading: boolean;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const pollIntervalRef = useRef<number | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await api.get('/api/notifications/');
      console.log('Notifications fetched:', response.data);
      setNotifications(response.data.results || []);
    } catch (error: any) {
      console.error('Fetch notifications error:', error.response?.data || error.message);
    }
  };

  // Refresh notifications manually
  const refreshNotifications = async () => {
    setIsLoading(true);
    await fetchNotifications();
    setIsLoading(false);
  };

  // Start polling for notifications
  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Poll every 10 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 10000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read/`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      console.error('Mark as read error:', error.response?.data || error.message);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/mark_all_read/');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error: any) {
      console.error('Mark all as read error:', error.response?.data || error.message);
    }
  };

  // Clear all notifications
  const clearNotifications = async () => {
    try {
      await api.delete('/api/notifications/clear/');
      setNotifications([]);
    } catch (error: any) {
      console.error('Clear notifications error:', error.response?.data || error.message);
    }
  };

  // Setup effects
  useEffect(() => {
    if (user) {
      refreshNotifications();
      startPolling();
    } else {
      setNotifications([]);
      stopPolling();
    }

    return () => stopPolling();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isLoading,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
