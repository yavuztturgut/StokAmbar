export interface Ingredient {
  id: number;
  accountId: number;
  name: string;
  category?: string | null;
  sku?: string | null;
  supplier?: string | null;
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

export interface StockCountAdjustment {
  id: number;
  accountId: number;
  ingredientId: number;
  expectedStock: number;
  countedStock: number;
  difference: number;
  note?: string | null;
  createdAt: string;
  ingredient?: {
    id: number;
    name: string;
    unit: string;
  };
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
  requiresCompanySelection?: boolean;
  selectionToken?: string;
}

