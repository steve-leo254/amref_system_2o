import type { LoginCredentials, SignupData, AuthResponse, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge additional headers
    if (options.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Request failed');
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred');
    }
  }

  // Auth endpoints
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
      }),
    });
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Login failed');
      }

      // Store token if provided
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
      }

      return data as AuthResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Login failed');
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async health(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export default new ApiService();
