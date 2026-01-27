'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'ADMIN':
          router.push('/dashboard');
          break;
        case 'MANAGER':
        case 'OPERATOR':
        default:
          router.push('/voc/kanban');
          break;
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">VOC Auto Bot</h1>
        <p className="mt-2 text-gray-600">AI 기반 VOC 자동 분류 및 처리 시스템</p>
      </div>

      <LoginForm />

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; 2024 VOC Auto Bot. All rights reserved.</p>
      </footer>
    </div>
  );
}
