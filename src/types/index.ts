export interface Ingredient {
  id: number;
  accountId: number;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
}

export interface LogEntry {
  id: number;
  accountId: number;
  action: string;
  ingredientName: string;
  quantity?: number;
  details?: string;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  accountId: number;
  createdAt: string;
}

export interface Account {
  id: number;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  account: Account;
}

export interface TrendData {
  date: string;
  amount: number;
}

export interface TopMovingItem {
  name: string;
  amount: number;
  unit: string;
}

export interface DistributionData {
  name: string;
  current: number;
  min: number;
}

export interface AnalyticsData {
  summary: {
    totalItems: number;
    criticalCount: number;
    normalCount: number;
    topMovingItem: string;
  };
  trend: TrendData[];
  topMoving: TopMovingItem[];
  distribution: DistributionData[];
}
