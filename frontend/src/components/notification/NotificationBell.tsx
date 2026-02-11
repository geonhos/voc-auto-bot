'use client';

import { BellIcon, CheckCheckIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/useToast';
import type { NotificationItem } from '@/types/notification';

const TYPE_ICON: Record<string, string> = {
  VOC_CREATED: 'add_circle',
  STATUS_CHANGED: 'sync',
  AI_ANALYSIS_COMPLETE: 'psychology',
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export function NotificationBell() {
  const { notifications, unreadCount, sseNotification, markAsRead, markAllAsRead } =
    useNotifications();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Show toast when SSE notification arrives
  useEffect(() => {
    if (sseNotification) {
      toast({
        title: sseNotification.title,
        description: sseNotification.message,
        variant: 'default',
      });
    }
  }, [sseNotification, toast]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
        aria-label="알림"
      >
        <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheckIcon className="h-3 w-3" />
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                알림이 없습니다.
              </div>
            ) : (
              notifications.slice(0, 10).map((notification: NotificationItem) => (
                <div key={notification.id}>
                  {notification.vocId ? (
                    <Link
                      href={`/voc/${notification.vocId}`}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <NotificationContent notification={notification} />
                    </Link>
                  ) : (
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <NotificationContent notification={notification} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationContent({ notification }: { notification: NotificationItem }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <span className="material-icons-outlined text-primary text-lg">
          {TYPE_ICON[notification.type] || 'notifications'}
        </span>
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 mt-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full block" />
        </div>
      )}
    </div>
  );
}
