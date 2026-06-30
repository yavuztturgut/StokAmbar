'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { clientRequest } from '@/lib/clientApi';
import { Account, AuthResponse, User } from '@/types';

interface RegisterData {
  email: string;
  username: string;
  password: string;
  accountName: string;
  accountEmail: string;
  phone?: string;
}

interface PendingSelection {
  user: User;
  accounts: Account[];
  selectionToken: string;
}

interface ProfileResponse {
  user: User;
  activeAccount: Account;
  accounts: Account[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  activeAccount: Account | null;
  accounts: Account[];
  pendingSelection: PendingSelection | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse | void>;
  selectCompany: (accountId: number) => Promise<void>;
  switchAccount: (accountId: number) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  createAccount: (data: { name: string; email: string; phone?: string }) => Promise<void>;
  updateAccount: (id: number, data: { name?: string; email?: string; phone?: string }) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = (data: AuthResponse) => {
    setUser(data.user);
    setActiveAccount(data.activeAccount);
    setAccounts(data.accounts || []);
    setPendingSelection(null);
    setIsAuthenticated(true);
  };

  const clearSession = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveAccount(null);
    setAccounts([]);
    setPendingSelection(null);
  };

  const applyProfile = (data: ProfileResponse) => {
    setUser(data.user);
    setActiveAccount(data.activeAccount);
    setAccounts(data.accounts || []);
    setIsAuthenticated(true);
  };

  const fetchProfile = async () => {
    try {
      const data = await clientRequest<ProfileResponse>(
        '/api/auth/profile',
        undefined,
        'Profil yuklenemedi'
      );
      applyProfile(data);
    } catch (error) {
      console.error('Profil yukleme hatasi:', error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    setIsLoading(true);
    try {
      const data = await clientRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      }, 'Giris basarisiz');

      if (data.requiresCompanySelection) {
        if (!data.selectionToken) {
          throw new Error('Sirket secim tokeni alinamadi');
        }
        setPendingSelection({
          user: data.user,
          accounts: data.accounts || [],
          selectionToken: data.selectionToken,
        });
        setIsAuthenticated(false);
        setUser(null);
        setActiveAccount(null);
        setAccounts([]);
        return data;
      }

      applySession(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const selectCompany = async (accountId: number) => {
    if (!pendingSelection) {
      throw new Error('Bekleyen sirket secimi bulunamadi');
    }

    setIsLoading(true);
    try {
      const data = await clientRequest<AuthResponse>('/api/auth/select-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectionToken: pendingSelection.selectionToken,
          accountId,
        }),
      }, 'Sirket secimi basarisiz');
      applySession(data);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (accountId: number) => {
    const data = await clientRequest<AuthResponse>('/api/auth/switch-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    }, 'Sirket degistirilemedi');
    applySession(data);
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const result = await clientRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }, 'Kayit basarisiz');
      applySession(result);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    const data = await clientRequest<ProfileResponse>(
      '/api/auth/profile',
      undefined,
      'Profil yenilenemedi'
    );
    applyProfile(data);
  };

  const createAccount = async (data: { name: string; email: string; phone?: string }) => {
    await clientRequest('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Sirket olusturulamadi');
    await refreshProfile();
  };

  const updateAccount = async (id: number, data: { name?: string; email?: string; phone?: string }) => {
    await clientRequest(`/api/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Sirket guncellenemedi');
    await refreshProfile();
  };

  const deleteAccount = async (id: number) => {
    const result = await clientRequest<AuthResponse | { success: boolean }>(`/api/accounts/${id}`, {
      method: 'DELETE',
    }, 'Sirket silinemedi');
    if ('activeAccount' in result && 'accounts' in result) {
      applySession(result);
      return;
    }
    await refreshProfile();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await clientRequest('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    }, 'Sifre degistirilemedi');
    clearSession();
  };

  const logout = async () => {
    try {
      await clientRequest('/api/auth/logout', { method: 'POST' }, 'Cikis yapilamadi');
    } catch (error) {
      console.error('Logout hatasi:', error);
    }
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        activeAccount,
        accounts,
        pendingSelection,
        login,
        selectCompany,
        switchAccount,
        register,
        createAccount,
        updateAccount,
        deleteAccount,
        changePassword,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
