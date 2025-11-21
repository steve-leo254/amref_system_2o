// User types
export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  date_of_birth?: string;
  role: 'patient' | 'doctor' | 'admin';
  created_at?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  gender?: string;
  date_of_birth?: string;
}

export interface AuthResponse {
  user_id?: number;
  email: string;
  message: string;
  token?: string;
  access_token?: string;
}

// Auth Context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form Input types
export interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autocomplete?: string;
  icon?: React.ReactNode;
}

export interface SelectInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  error?: string;
  required?: boolean;
}

export interface CheckboxProps {
  id: string;
  name: string;
  label: string | React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
}
