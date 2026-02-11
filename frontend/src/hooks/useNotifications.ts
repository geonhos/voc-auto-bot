'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationApi } from '@/lib/api/notificationApi';
import type { NotificationItem } from '@/types/notification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export function useNotifications() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [sseNotification, setSseNotification] = useState<NotificationItem | null>(null);

  // Fetch notifications list
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    staleTime: 1000 * 60,
  });

  // Fetch unread count
  const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 1000 * 30,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // SSE connection
  useEffect(() => {
    const sseUrl = `${API_BASE_URL}/v1/notifications/stream`;

    try {
      const eventSource = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data) as NotificationItem;
          setSseNotification(notification);
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (e) {
          console.error('Failed to parse SSE notification:', e);
        }
      });

      eventSource.addEventListener('connect', () => {
        console.log('SSE connected');
      });

      eventSource.onerror = () => {
        console.warn('SSE connection error, will retry...');
      };
    } catch (e) {
      console.warn('Failed to create EventSource:', e);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient]);

  const markAsRead = useCallback(
    (id: number) => markAsReadMutation.mutate(id),
    [markAsReadMutation],
  );

  const markAllAsRead = useCallback(
    () => markAllAsReadMutation.mutate(),
    [markAllAsReadMutation],
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    sseNotification,
    markAsRead,
    markAllAsRead,
    refetch,
    refetchUnread,
  };
}
