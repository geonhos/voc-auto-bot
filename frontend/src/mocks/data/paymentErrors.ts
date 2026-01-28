import type { PaymentErrorLog, PaymentTransaction } from '@/types';
import paymentErrorsJson from './paymentErrors.json';

/**
 * Mock payment error logs data
 */
export const mockPaymentErrorLogs: PaymentErrorLog[] = paymentErrorsJson.paymentErrorLogs;

/**
 * Mock payment transactions data
 */
export const mockPaymentTransactions: PaymentTransaction[] = paymentErrorsJson.paymentTransactions;

/**
 * Get payment error logs with optional filtering
 */
export function getPaymentErrorLogs(filters?: {
  errorCode?: string;
  accountId?: string;
  level?: string;
  fromDate?: string;
  toDate?: string;
}): PaymentErrorLog[] {
  let logs = [...mockPaymentErrorLogs];

  if (filters) {
    if (filters.errorCode) {
      logs = logs.filter((log) => log.errorCode === filters.errorCode);
    }
    if (filters.accountId) {
      logs = logs.filter((log) => log.accountId === filters.accountId);
    }
    if (filters.level) {
      logs = logs.filter((log) => log.level === filters.level);
    }
    if (filters.fromDate) {
      logs = logs.filter((log) => log.timestamp >= filters.fromDate!);
    }
    if (filters.toDate) {
      logs = logs.filter((log) => log.timestamp <= filters.toDate!);
    }
  }

  return logs;
}

/**
 * Get payment transactions with optional filtering
 */
export function getPaymentTransactions(filters?: {
  status?: string;
  accountId?: string;
  errorCode?: string;
}): PaymentTransaction[] {
  let transactions = [...mockPaymentTransactions];

  if (filters) {
    if (filters.status) {
      transactions = transactions.filter((txn) => txn.status === filters.status);
    }
    if (filters.accountId) {
      transactions = transactions.filter((txn) => txn.accountId === filters.accountId);
    }
    if (filters.errorCode) {
      transactions = transactions.filter((txn) => txn.errorCode === filters.errorCode);
    }
  }

  return transactions;
}

/**
 * Get a random payment error scenario
 */
export function getRandomPaymentError(): PaymentErrorLog {
  const randomIndex = Math.floor(Math.random() * mockPaymentErrorLogs.length);
  return mockPaymentErrorLogs[randomIndex];
}
