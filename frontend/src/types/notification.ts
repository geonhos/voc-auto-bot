export type NotificationType = 'VOC_CREATED' | 'STATUS_CHANGED' | 'AI_ANALYSIS_COMPLETE';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  vocId: number | null;
  read: boolean;
  createdAt: string;
}
