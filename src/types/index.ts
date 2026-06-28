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
  accountId: number | null;
  createdAt: string;
}

export interface Account {
  id: number;
  ownerId?: number;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  activeAccount: Account;
  accounts: Account[];
  token?: string;
  requiresCompanySelection?: boolean;
  selectionToken?: string;
}

