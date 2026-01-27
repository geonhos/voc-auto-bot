'use client';

import { useState, useEffect, useRef } from 'react';
import type { User, UserRole } from '@/types';
import { useToggleUserStatus, useUnlockUser, useResetPassword } from '@/hooks/useUsers';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  isLoading?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: '관리자',
  MANAGER: '매니저',
  OPERATOR: '상담원',
};

const roleBadgeColors: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  OPERATOR: 'bg-green-100 text-green-800',
};

export function UserTable({ users, onEdit, isLoading }: UserTableProps) {
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleStatusMutation = useToggleUserStatus();
  const unlockMutation = useUnlockUser();
  const resetPasswordMutation = useResetPassword();
  const toast = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setActionUserId(null);
      }
    };

    if (actionUserId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [actionUserId]);

  const handleToggleStatus = async (user: User) => {
    if (confirm(`${user.name}님을 ${user.isActive ? '비활성화' : '활성화'} 하시겠습니까?`)) {
      await toggleStatusMutation.mutateAsync({ userId: user.id, isActive: !user.isActive });
    }
  };

  const handleUnlock = async (user: User) => {
    if (confirm(`${user.name}님의 계정 잠금을 해제하시겠습니까?`)) {
      await unlockMutation.mutateAsync(user.id);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (confirm(`${user.name}님에게 임시 비밀번호를 발급하시겠습니까?`)) {
      try {
        const result = await resetPasswordMutation.mutateAsync(user.id);
        await navigator.clipboard.writeText(result.temporaryPassword);
        toast.success(
          '임시 비밀번호가 클립보드에 복사되었습니다. 사용자에게 안전하게 전달하세요.',
          '비밀번호 발급 완료'
        );
      } catch (error) {
        toast.error('클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.', '복사 실패');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        등록된 사용자가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              사용자
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              이메일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              역할
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              액션
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={cn(
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    roleBadgeColors[user.role]
                  )}
                >
                  {roleLabels[user.role]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.isActive ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    활성
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    비활성
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium overflow-visible">
                <div className="relative inline-block text-left" ref={actionUserId === user.id ? dropdownRef : null}>
                  <button
                    onClick={() => setActionUserId(actionUserId === user.id ? null : user.id)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="액션 메뉴"
                    aria-expanded={actionUserId === user.id}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {actionUserId === user.id && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onEdit(user);
                            setActionUserId(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => {
                            handleToggleStatus(user);
                            setActionUserId(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {user.isActive ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => {
                            handleResetPassword(user);
                            setActionUserId(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          임시 비밀번호 발급
                        </button>
                        {!user.isActive && (
                          <button
                            onClick={() => {
                              handleUnlock(user);
                              setActionUserId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            잠금 해제
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
