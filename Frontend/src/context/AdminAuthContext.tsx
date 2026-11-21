import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { adminApi, getAdminToken, removeAdminToken, ADMIN_USER_KEY } from '../services/adminApi';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAdminToken()));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAdmin = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setAdminUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const me = await adminApi.getMe();
      if (me && me.role === 'admin') {
        setAdminUser({
          id: me.id,
          name: me.name || 'DriveNow Admin',
          email: me.email || 'admin@drivenow.com',
          role: me.role,
          phone: me.phone,
        });
        setIsAuthenticated(true);
      } else {
        removeAdminToken();
        setAdminUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.warn('Admin token verification failed:', err);
      removeAdminToken();
      setAdminUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await adminApi.login(email, password);
    const user = data?.user;
    if (user && user.role === 'admin') {
      setAdminUser({
        id: user.id,
        name: user.name || 'DriveNow Admin',
        email: user.email,
        role: user.role,
        phone: user.phone,
      });
      setIsAuthenticated(true);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    adminApi.logout();
    setAdminUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
