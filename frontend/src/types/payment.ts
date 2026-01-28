/**
 * Payment-related types
 */

export type PaymentErrorCode =
  | 'PAYMENT_TIMEOUT'
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_CARD'
  | 'CARD_EXPIRED'
  | 'NETWORK_ERROR'
  | 'FRAUD_DETECTED'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'SYSTEM_ERROR'
  | 'AUTHENTICATION_FAILED'
  | 'DUPLICATE_TRANSACTION'
  | 'MERCHANT_NOT_FOUND'
  | 'CURRENCY_NOT_SUPPORTED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'REFUNDED';

export interface PaymentErrorLog {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'CRITICAL';
  service: string;
  errorCode: PaymentErrorCode;
  message: string;
  accountId: string;
  transactionId: string;
  amount: number;
  currency?: string;
  cardLast4?: string;
  merchantId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  accountId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  errorCode?: PaymentErrorCode;
  errorMessage?: string;
  cardLast4?: string;
  merchantId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
}

export interface PaymentRequest {
  accountId: string;
  amount: number;
  currency: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  merchantId: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: PaymentStatus;
  errorCode?: PaymentErrorCode;
  errorMessage?: string;
  timestamp: string;
}
