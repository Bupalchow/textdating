import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface User {
  user_id: number;
  username: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user_id: number;
  username: string;
}

export interface RegisterData {
  anonymous_name: string;
  password: string;
  email?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

class AuthService {
  async register(data: RegisterData): Promise<{ message: string }> {
    try {
      console.log('Sending registration request:', data);
      const response = await api.post('/api/register/', data);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            `Server error (${error.response.status})`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Network error - request was made but no response received
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Something else happened
        throw new Error(error.message || 'Registration failed');
      }
    }
  }

  async login(data: LoginData): Promise<LoginResponse> {
    try {
      console.log('Sending login request:', data);
      const response = await api.post('/api/login/', data);
      console.log('Login response:', response.data);
      const { access, refresh, user_id, username } = response.data;

      // Store tokens and user data
      await AsyncStorage.multiSet([
        ['access_token', access],
        ['refresh_token', refresh],
        ['user_data', JSON.stringify({ user_id, username })],
      ]);

      console.log('Tokens stored successfully');
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            `Server error (${error.response.status})`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Network error - request was made but no response received
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Something else happened
        throw new Error(error.message || 'Login failed');
      }
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return token !== null;
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return null;

      const response = await api.post('/api/token/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      await AsyncStorage.setItem('access_token', access);
      return access;
    } catch {
      await this.logout();
      return null;
    }
  }
}

export default new AuthService();
