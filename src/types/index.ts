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
  user: User;
  account: Account;
}

