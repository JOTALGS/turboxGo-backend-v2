export interface User {
  id: string;
  plan_id: string;
  name: string;
  email: string;
  photo_url?: string;
  password_hash?: string;
  firebase_uid?: string;
  created_at?: Date;
  last_login?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
}