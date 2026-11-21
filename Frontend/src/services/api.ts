/**
 * DriveNow Customer API Service
 * Dedicated API client for Customer application flows.
 * Uses 'drivenow_customer_token' for customer authentication.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  details?: any;
}

export const CUSTOMER_TOKEN_KEY = 'drivenow_customer_token';
export const CUSTOMER_REFRESH_KEY = 'drivenow_customer_refresh_token';

export function getToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_REFRESH_KEY);
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

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

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    message: response.statusText,
    data: null as any,
  }));

  if (!response.ok || json.success === false) {
    const errorMsg = json.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data;
}

// ---------------- CUSTOMER AUTH API ---------------- //
export const authApi = {
  async login(email: string, password: string) {
    const data = await request<{
      tokens: { access_token: string; refresh_token: string; expires_in: number };
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data?.tokens?.access_token) {
      setToken(data.tokens.access_token);
      if (data.tokens.refresh_token) {
        localStorage.setItem(CUSTOMER_REFRESH_KEY, data.tokens.refresh_token);
      }
    }
    return data;
  },

  async register(userData: { name: string; email: string; phone: string; password: string }) {
    const data = await request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data?.tokens?.access_token) {
      setToken(data.tokens.access_token);
      if (data.tokens.refresh_token) {
        localStorage.setItem(CUSTOMER_REFRESH_KEY, data.tokens.refresh_token);
      }
    }
    return data;
  },

  async getMe() {
    return request<any>('/auth/me');
  },

  logout() {
    removeToken();
  },
};

// ---------------- PROFILE API ---------------- //
export const profileApi = {
  async get() {
    return request<any>('/profile');
  },

  async update(formData: {
    name?: string;
    phone?: string;
    dob?: string;
    date_of_birth?: string;
    address?: string;
    licenceNumber?: string;
    licence_number?: string;
  }) {
    return request<any>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(formData),
    });
  },

  async uploadKYCDocument(documentType: string, file: File) {
    const url = `${API_BASE}/profile/kyc/documents`;
    const token = getToken();
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await response.json().catch(() => ({
      success: false,
      message: 'Failed to upload document',
    }));

    if (!response.ok || json.success === false) {
      throw new Error(json.message || 'Failed to upload document');
    }
    return json.data;
  },

  async submitKYC(licenceNumber?: string) {
    return request<any>('/profile/kyc/submit', {
      method: 'POST',
      body: JSON.stringify({ licence_number: licenceNumber }),
    });
  },

  async getKYCDocuments() {
    return request<any[]>('/profile/kyc');
  },

  getDocumentViewUrl(documentId: string): string {
    const token = getToken();
    return `${API_BASE}/profile/kyc/documents/${documentId}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};

// ---------------- WALLET API ---------------- //
export const walletApi = {
  async get() {
    return request<any>('/wallet');
  },

  async topUp(amount: number, paymentMethod: string = 'upi') {
    return request<any>('/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod }),
    });
  },

  async getTransactions() {
    return request<any[]>('/wallet/transactions');
  },
};

// ---------------- BOOKINGS API ---------------- //
export interface BookingPayload {
  car_id: string;
  pickup_location: string;
  drop_location?: string;
  pickup_date: string;
  return_date?: string;
  pickup_time?: string;
  return_time?: string;
  duration_type?: 'hourly' | 'daily' | 'weekly' | string;
  duration_value?: number;
  with_driver?: boolean;
  coupon_code?: string;
  use_wallet?: boolean;
  payment_method?: 'upi' | 'card' | 'netbanking' | 'cash' | 'wallet';
}

export const bookingsApi = {
  async list(status?: string) {
    const query = status ? `?status=${status}` : '';
    return request<any[]>(`/bookings${query}`);
  },

  async get(id: string) {
    return request<any>(`/bookings/${id}`);
  },

  async create(payload: BookingPayload) {
    return request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async cancel(id: string, reason: string = 'Customer requested cancellation') {
    return request<any>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async delete(id: string) {
    return request<any>(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },

  async getQuote(params: {
    car_id: string;
    pickup_date: string;
    return_date?: string;
    duration_type?: string;
    duration_value?: number;
    with_driver?: boolean;
    coupon_code?: string;
    use_wallet?: boolean;
  }) {
    return request<any>('/bookings/quote', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async track(id: string) {
    return request<any>(`/bookings/${id}/track`);
  },
};

// ---------------- CARS & HUBS API ---------------- //
export const carsApi = {
  async list(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    const qs = params.toString();
    return request<any>(`/cars${qs ? `?${qs}` : ''}`);
  },

  async get(id: string) {
    return request<any>(`/cars/${id}`);
  },

  async checkAvailability(id: string, pickupDate: string, returnDate?: string) {
    const qs = returnDate ? `?pickup_date=${pickupDate}&return_date=${returnDate}` : `?pickup_date=${pickupDate}`;
    return request<any>(`/cars/${id}/availability${qs}`);
  },
};

export const locationsApi = {
  async list() {
    return request<any[]>('/locations');
  },
};

export const offersApi = {
  async list() {
    return request<any[]>('/offers');
  },
};

// ---------------- EMERGENCY ROADSIDE API ---------------- //
export const roadsideApi = {
  async create(data: {
    issue_type: string;
    location: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
    booking_id?: string;
  }) {
    return request<any>('/roadside/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async list(status?: string) {
    const qs = status ? `?status=${status}` : '';
    return request<any>(`/roadside/requests${qs}`);
  },

  async get(id: string) {
    return request<any>(`/roadside/requests/${id}`);
  },
};

// ---------------- TRIP PLANNER API ---------------- //
export const tripPlannerApi = {
  async recommend(data: {
    destination: string;
    passengers: number;
    days: number;
    purpose?: string;
    budget: number;
    need_driver?: boolean;
  }) {
    return request<any>('/trip-planner/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ---------------- REVIEWS API ---------------- //
export interface ReviewPayload {
  booking_id: string;
  rating: number;
  comment: string;
}

export const reviewsApi = {
  async create(payload: ReviewPayload) {
    return request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyReviews() {
    return request<any[]>('/reviews/my');
  },

  async getByBooking(bookingId: string) {
    return request<any>(`/reviews/booking/${bookingId}`);
  },
};
