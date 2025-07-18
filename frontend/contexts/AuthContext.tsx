import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService, { User } from '../utils/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (anonymousName: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('AuthContext: Starting login process');
      const response = await AuthService.login({ username, password });
      console.log('AuthContext: Login successful, updating state');
      setUser({ user_id: response.user_id, username: response.username });
      setIsAuthenticated(true);
      console.log('AuthContext: State updated successfully');
    } catch (error) {
      console.error('AuthContext: Login failed', error);
      throw error;
    }
  };

  const register = async (anonymousName: string, password: string, email?: string) => {
    try {
      console.log('AuthContext: Starting registration process');
      await AuthService.register({
        anonymous_name: anonymousName,
        password,
        email,
      });
      console.log('AuthContext: Registration successful');
    } catch (error) {
      console.error('AuthContext: Registration failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
