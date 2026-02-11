export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR';
