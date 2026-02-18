'use client';

import {
  LayoutDashboardIcon,
  InboxIcon,
  ListIcon,
  KanbanIcon,
  MailIcon,
  UsersIcon,
  TagIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebarStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: '대시보드',
    href: '/dashboard',
    icon: <LayoutDashboardIcon className="h-5 w-5" />,
  },
  {
    label: 'VOC 인입',
    href: '/voc/input',
    icon: <InboxIcon className="h-5 w-5" />,
  },
  {
    label: 'VOC 목록',
    href: '/voc/table',
    icon: <ListIcon className="h-5 w-5" />,
  },
  {
    label: 'VOC 칸반',
    href: '/voc/kanban',
    icon: <KanbanIcon className="h-5 w-5" />,
  },
  {
    label: '이메일 템플릿',
    href: '/admin/email-templates',
    icon: <MailIcon className="h-5 w-5" />,
  },
  {
    label: '사용자 관리',
    href: '/admin/users',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    label: '카테고리 관리',
    href: '/admin/categories',
    icon: <TagIcon className="h-5 w-5" />,
  },
  {
    label: '감사 로그',
    href: '/admin/audit-logs',
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed: collapsed, toggle: toggleCollapsed } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">VOC Bot</span>
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
