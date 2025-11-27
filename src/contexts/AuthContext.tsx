import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getCurrentUser, login as authLogin, logout as authLogout, register as authRegister } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (mobile: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (fullName: string, mobile: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // بررسی لاگین بودن کاربر در بارگذاری اولیه
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (mobile: string, password: string) => {
    const result = await authLogin(mobile, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, message: result.message };
  };

  // Register removed - only admin can create users
  const register = async () => {
    return { success: false, message: 'ثبت‌نام غیرفعال است' };
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
