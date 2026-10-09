'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('route53_token');
    if (storedToken) {
      setToken(storedToken);
      authApi.me()
        .then(u => setUser(u))
        .catch(() => {
          localStorage.removeItem('route53_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('route53_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await authApi.register(username, email, password);
    localStorage.setItem('route53_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('route53_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
