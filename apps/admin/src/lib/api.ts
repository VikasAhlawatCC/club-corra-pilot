import type { 
  Brand, 
  BrandCategory, 
  CreateBrandRequest, 
  UpdateBrandRequest, 
  CreateBrandCategoryRequest, 
  UpdateBrandCategoryRequest,
  CoinTransaction
} from '@shared/schemas'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token')
  }
  return null
}

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Add authentication token
  const token = getAuthToken()
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(response.status, errorData.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error')
  }
}

// Transaction Management API
export const transactionApi = {
  // Get pending transactions
  getPendingTransactions: (page = 1, limit = 20, type?: 'EARN' | 'REDEEM') =>
    apiRequest<{ success: boolean, message: string, data: { data: CoinTransaction[], total: number, page: number, limit: number, totalPages: number } }>(
      `/admin/coins/transactions/pending?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`
    ),

  // Get all transactions
  getAllTransactions: (page = 1, limit = 20, userId?: string) =>
    apiRequest<{ success: boolean, message: string, data: { data: CoinTransaction[], total: number, page: number, limit: number, totalPages: number } }>(
      `/admin/coins/transactions?page=${page}&limit=${limit}${userId ? `&userId=${userId}` : ''}`
    ),

  // Get user pending requests for verification navigation
  getUserPendingRequests: (userId: string) =>
    apiRequest<{ success: boolean, message: string, data: { data: CoinTransaction[], total: number, page: number, limit: number, totalPages: number } }>(
      `/admin/coins/users/${userId}/pending-requests`
    ),

  // Get user details for verification form
  getUserDetails: (userId: string) =>
    apiRequest<{ success: boolean, message: string, data: { user: any } }>(
      `/admin/coins/users/${userId}/details`
    ),

  // Get complete user verification data (user details + pending requests)
  getUserVerificationData: (userId: string) =>
    apiRequest<{ 
      success: boolean, 
      message: string, 
      data: { 
        user: any, 
        pendingRequests: { 
          data: any[], 
          total: number, 
          page: number, 
          limit: number, 
          totalPages: number 
        } 
      } 
    }>(
      `/admin/coins/users/${userId}/verification-data`
    ),

  // Approve earn transaction
  approveEarnTransaction: (id: string, adminUserId: string, adminNotes?: string) =>
    apiRequest<{ success: boolean, message: string, data: { transaction: CoinTransaction } }>(
      `/admin/coins/transactions/${id}/approve`,
      {
        method: 'PUT',
        body: JSON.stringify({ adminUserId, adminNotes }),
      }
    ),

  // Reject earn transaction
  rejectEarnTransaction: (id: string, adminUserId: string, adminNotes: string) =>
    apiRequest<{ success: boolean, message: string, data: { transactionId: string, adminNotes: string } }>(
      `/admin/coins/transactions/${id}/reject`,
      {
        method: 'PUT',
        body: JSON.stringify({ adminUserId, adminNotes }),
      }
    ),

  // Approve redeem transaction
  approveRedeemTransaction: (id: string, adminUserId: string, adminNotes?: string) =>
    apiRequest<{ success: boolean, message: string, data: { transaction: CoinTransaction } }>(
      `/admin/coins/transactions/${id}/approve-redeem`,
      {
        method: 'PUT',
        body: JSON.stringify({ adminUserId, adminNotes }),
      }
    ),

  // Reject redeem transaction
  rejectRedeemTransaction: (id: string, adminUserId: string, adminNotes: string) =>
    apiRequest<{ success: boolean, message: string, data: { transaction: CoinTransaction } }>(
      `/admin/coins/transactions/${id}/reject-redeem`,
      {
        method: 'PUT',
        body: JSON.stringify({ adminUserId, adminNotes }),
      }
    ),

  // Process payment
  processPayment: (
    id: string, 
    adminUserId: string, 
    paymentTransactionId: string, 
    paymentMethod: string, 
    paymentAmount: number, 
    adminNotes?: string
  ) =>
    apiRequest<{ success: boolean, message: string, data: { transaction: CoinTransaction } }>(
      `/admin/coins/transactions/${id}/process-payment`,
      {
        method: 'PUT',
        body: JSON.stringify({ 
          adminUserId, 
          paymentTransactionId, 
          paymentMethod, 
          paymentAmount, 
          adminNotes 
        }),
      }
    ),

  // Get transaction statistics
  getTransactionStats: () =>
    apiRequest<{ success: boolean, message: string, data: any }>(
      '/admin/coins/stats/transactions'
    ),

  // Get payment statistics
  getPaymentStats: (startDate?: string, endDate?: string) =>
    apiRequest<{ success: boolean, message: string, data: any }>(
      `/admin/coins/stats/payments${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`
    ),

  // Get payment summary
  getPaymentSummary: (transactionId: string) =>
    apiRequest<{ success: boolean, message: string, data: any }>(
      `/admin/coins/payments/${transactionId}/summary`
    ),
}

// Brand Management API
export const brandApi = {
  // Get all brands
  getAllBrands: (page = 1, limit = 20, query?: string, categoryId?: string, isActive?: boolean) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (query) params.append('query', query)
    if (categoryId) params.append('categoryId', categoryId)
    if (isActive !== undefined) params.append('isActive', isActive.toString())
    
    return apiRequest<{ data: Brand[], total: number, page: number, limit: number, totalPages: number }>(
      `/brands?${params.toString()}`
    )
  },

  // Get active brands
  getActiveBrands: () =>
    apiRequest<Brand[]>('/brands/active'),

  // Get brands by category
  getBrandsByCategory: (categoryId: string) =>
    apiRequest<Brand[]>(`/brands/category/${categoryId}`),

  // Get brand by ID
  getBrand: (id: string) =>
    apiRequest<Brand>(`/brands/${id}`),

  // Create brand
  createBrand: (data: CreateBrandRequest) =>
    apiRequest<Brand>('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update brand
  updateBrand: (id: string, data: UpdateBrandRequest) =>
    apiRequest<Brand>(`/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Toggle brand status
  toggleBrandStatus: (id: string) =>
    apiRequest<Brand>(`/brands/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  // Delete brand
  deleteBrand: (id: string) =>
    apiRequest<{ success: boolean, message: string }>(`/brands/${id}`, {
      method: 'DELETE',
    }),
}

// Category Management API
export const categoryApi = {
  // Get all categories
  getAllCategories: () =>
    apiRequest<BrandCategory[]>('/brand-categories'),

  // Get category by ID
  getCategory: (id: string) =>
    apiRequest<BrandCategory>(`/brand-categories/${id}`),

  // Create category
  createCategory: (data: CreateBrandCategoryRequest) =>
    apiRequest<BrandCategory>('/brand-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update category
  updateCategory: (id: string, data: UpdateBrandCategoryRequest) =>
    apiRequest<BrandCategory>(`/brand-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Delete category
  deleteCategory: (id: string) =>
    apiRequest<{ success: boolean, message: string }>(`/brand-categories/${id}`, {
      method: 'DELETE',
    }),
}

// User Management API
export const userApi = {
  // Get user balance
  getUserBalance: (userId: string) =>
    apiRequest<{ success: boolean, message: string, data: { balance: any } }>(
      `/admin/coins/balance/${userId}`
    ),

  // Get user transaction summary
  getUserTransactionSummary: (userId: string) =>
    apiRequest<{ success: boolean, message: string, data: any }>(
      `/admin/coins/summary/${userId}`
    ),

  // Get user transactions
  getUserTransactions: (userId: string, page = 1, limit = 20) =>
    apiRequest<{ success: boolean, message: string, data: any }>(
      `/admin/coins/transactions?userId=${userId}&page=${page}&limit=${limit}`
    ),
}

// Welcome Bonus API
export const welcomeBonusApi = {
  // Create welcome bonus
  createWelcomeBonus: (userId: string, amount: number = 100) =>
    apiRequest<{ success: boolean, message: string, data: any }>(
      '/admin/coins/welcome-bonus',
      {
        method: 'POST',
        body: JSON.stringify({ userId, amount }),
      }
    ),
}

export { ApiError }
