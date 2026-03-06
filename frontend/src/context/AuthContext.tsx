import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage helper that works on both web and native
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore errors
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        keys.forEach(key => localStorage.removeItem(key));
      } catch {
        // Ignore errors
      }
      return;
    }
    return AsyncStorage.multiRemove(keys);
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('token');
      const storedUser = await storage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token is still valid
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          await storage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          // Token invalid, clear storage
          await storage.multiRemove(['token', 'user']);
          setToken(null);
          setUser(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    
    setToken(newToken);
    setUser(userData);
    
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    try {
      await storage.setItem('token', newToken);
      await storage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.log('Storage save error (non-critical):', e);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, phone, password });
    const { token: newToken, user: userData } = response.data;
    
    setToken(newToken);
    setUser(userData);
    
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    try {
      await storage.setItem('token', newToken);
      await storage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.log('Storage save error (non-critical):', e);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    await storage.multiRemove(['token', 'user']);
  };

  const updateUser = async (userData: User) => {
    setUser(userData);
    await storage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
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
