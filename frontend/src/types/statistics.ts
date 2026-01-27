export interface KpiData {
  totalVocs: number;
  resolvedVocs: number;
  pendingVocs: number;
  avgResolutionTimeHours: number;
  resolutionRate: number;
  todayVocs: number;
  weekVocs: number;
  monthVocs: number;
}

export interface TrendData {
  date: string;
  received: number;
  resolved: number;
  pending: number;
}

export interface CategoryStats {
  categoryId: number;
  categoryName: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  statusLabel: string;
  count: number;
  percentage: number;
}

export interface ChannelStats {
  channel: string;
  channelLabel: string;
  count: number;
  percentage: number;
}

export interface AssigneeStats {
  userId: number;
  userName: string;
  assignedCount: number;
  resolvedCount: number;
  avgResolutionTimeHours: number;
}

export interface PriorityStats {
  priority: string;
  priorityLabel: string;
  count: number;
  percentage: number;
}

export interface DashboardData {
  kpi: KpiData;
  trend: TrendData[];
  categoryStats: CategoryStats[];
  statusDistribution: StatusDistribution[];
  channelStats: ChannelStats[];
  priorityStats: PriorityStats[];
  topAssignees: AssigneeStats[];
}

export interface StatisticsParams {
  fromDate?: string;
  toDate?: string;
  categoryId?: number;
  [key: string]: string | number | undefined;
}
