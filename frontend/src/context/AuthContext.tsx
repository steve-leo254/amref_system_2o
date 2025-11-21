import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '../services';
import type { User, LoginCredentials, SignupData } from '../types';

interface JwtPayload {
  sub: string;
  id: number;
  role: string;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          const decoded: JwtPayload = jwtDecode(storedToken);
          setRole(decoded.role);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to restore auth:', err);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setRole(null);
          setIsAuthenticated(false);
        }
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(credentials);
      const newToken = response.access_token || response.token;

      if (!newToken) {
        throw new Error('No token received from server');
      }

      const decoded: JwtPayload = jwtDecode(newToken);
      
      // Get current user
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setRole(decoded.role);
      setIsAuthenticated(true);

      // Fetch user data
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.signup(data);
      const newToken = response.access_token || response.token;

      if (!newToken) {
        throw new Error('No token received from server');
      }

      const decoded: JwtPayload = jwtDecode(newToken);

      // Store token and login
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setRole(decoded.role);
      setIsAuthenticated(true);

      // Fetch user data
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        token,
        role,
        loading,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};