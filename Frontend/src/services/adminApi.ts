/**
 * DriveNow Admin API Service
 * Dedicated API client for Administrator portal.
 * Uses 'drivenow_admin_token' for admin authentication.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

export const ADMIN_TOKEN_KEY = 'drivenow_admin_token';
export const ADMIN_USER_KEY = 'drivenow_admin_user';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  details?: any;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

async function adminRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAdminToken();
    throw new Error('Unauthorized: Admin session expired. Please log in again.');
  }

  const json: any = await response.json().catch(() => ({
    success: false,
    message: response.statusText,
    data: null,
  }));

  if (!response.ok || json.success === false) {
    const errorMsg = json.message || `Admin request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  // Handle paginated responses
  if (json && json.meta !== undefined) {
    return {
      data: json.data,
      meta: json.meta,
    } as T;
  }

  // Unwrap data if present
  if (json && json.data !== undefined) {
    return json.data as T;
  }

  return json as T;
}

export const adminApi = {
  // Authentication
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json().catch(() => ({
      success: false,
      message: 'Network error connecting to backend API',
    }));

    if (!res.ok || json.success === false) {
      throw new Error(json.message || 'Invalid administrator credentials');
    }

    const userData = json.data?.user;
    if (!userData || userData.role !== 'admin') {
      throw new Error('Access denied: You must be an administrator to access the admin portal.');
    }

    const token = json.data?.tokens?.access_token;
    if (token) {
      setAdminToken(token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(userData));
    }

    return json.data;
  },

  async logout() {
    try {
      await adminRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Swallowed
    } finally {
      removeAdminToken();
    }
  },

  async getMe() {
    return adminRequest<any>('/auth/me');
  },

  // Dashboard Stats
  async getDashboard() {
    return adminRequest<any>('/admin/dashboard');
  },

  // Fleet & Car Management
  async listCars(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return adminRequest<any[]>(`/admin/cars${qs ? `?${qs}` : ''}`);
  },

  async addCar(carData: any) {
    return adminRequest<any>('/admin/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  },

  async deleteCar(id: string) {
    return adminRequest<any>(`/admin/cars/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleCarAvailability(id: string, isAvailable?: boolean) {
    return adminRequest<any>(`/admin/cars/${id}/availability`, {
      method: 'PATCH',
      body: isAvailable !== undefined ? JSON.stringify({ available: isAvailable }) : JSON.stringify({}),
    });
  },

  // Booking Management
  async listBookings(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return adminRequest<PaginatedResult<any>>(`/admin/bookings${qs ? `?${qs}` : ''}`);
  },

  async updateBookingStatus(id: string, status: string) {
    return adminRequest<any>(`/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteBooking(id: string) {
    return adminRequest<any>(`/admin/bookings/${id}`, {
      method: 'DELETE',
    });
  },

  // Customer Management
  async listCustomers(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(params).toString();
    return adminRequest<PaginatedResult<any>>(`/admin/customers${qs ? `?${qs}` : ''}`);
  },

  async toggleCustomerStatus(id: string, status: string) {
    return adminRequest<any>(`/admin/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getCustomerReviews(userId: string) {
    return adminRequest<any>(`/admin/customers/${userId}/reviews`);
  },

  // KYC Management
  async listKYC() {
    return adminRequest<any[]>('/admin/kyc');
  },

  async reviewKYC(userId: string, status: string, rejectionReason?: string) {
    return adminRequest<any>(`/admin/kyc/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejection_reason: rejectionReason }),
    });
  },

  getDocumentViewUrl(documentId: string): string {
    const token = getAdminToken();
    return `${API_BASE}/admin/kyc/documents/${documentId}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // Revenue & Reports
  async getRevenueReport() {
    return adminRequest<any>('/admin/revenue');
  },
};
