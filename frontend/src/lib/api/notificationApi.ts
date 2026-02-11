import type { NotificationItem } from '@/types/notification';
import { api } from './client';

export const notificationApi = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationItem[]> => {
    const response = await api.get<NotificationItem[]>('/notifications', { page, size });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<number>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch<void>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch<void>('/notifications/read-all');
  },
};
