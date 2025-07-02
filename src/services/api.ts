import axios from 'axios';
import { API_BASE_URL } from '../config';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

interface CompanyContent {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CompanyInfoBlock {
  id: number;
  company_id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

// Removed unused RefreshTokenResponse interface

interface CompanyDetails {
  name: string;
  industry: string;
  company_size: string;
  website: string;
  address: string;
  phone: string;
  company_information: string;
  company_values: string;
  company_mission: string;
}

const apiService = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            if (config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Add a generic download method
const download = async (url: string, params?: object): Promise<Blob> => {
    const response = await apiService.get<Blob>(url, {
        params,
        responseType: 'blob',
    });
    return response.data;
};

export interface Department {
  id: number;
  name: string;
  company_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Department API functions
export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiService.get<Department[]>('/admin/departments');
  return response.data;
};

export const createDepartment = async (name: string): Promise<Department> => {
  const response = await apiService.post<Department>('/admin/departments', { name });
  return response.data;
};

export const updateDepartment = async (id: number, name: string): Promise<Department> => {
  const response = await apiService.put<Department>(`/admin/departments/${id}`, { name });
  return response.data;
};

export const deleteDepartment = async (id: number): Promise<void> => {
  await apiService.delete(`/admin/departments/${id}`);
};

// Auth API functions
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiService.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await apiService.post<{ accessToken: string }>('/auth/refresh');
  return response.data;
};

export const register = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiService.post<LoginResponse>('/auth/register', { email, password });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiService.post('/auth/logout');
};

// Company Content API functions
export const getCompanyContent = async (): Promise<CompanyContent[]> => {
  const response = await apiService.get<CompanyContent[]>('/admin/company-content');
  return response.data;
};

export const createCompanyContent = async (data: Partial<CompanyContent>): Promise<CompanyContent> => {
  const response = await apiService.post<CompanyContent>('/admin/company-content', data);
  return response.data;
};

export const updateCompanyContent = async (id: number, data: Partial<CompanyContent>): Promise<CompanyContent> => {
  const response = await apiService.put<CompanyContent>(`/admin/company-content/${id}`, data);
  return response.data;
};

export const deleteCompanyContent = async (id: number): Promise<void> => {
  await apiService.delete(`/admin/company-content/${id}`);
};

// Company Info Blocks
export const getCompanyInfoBlocks = async (): Promise<CompanyInfoBlock[]> => {
  const response = await apiService.get<CompanyInfoBlock[]>('/dashboard/company-info-blocks');
  return response.data;
};

export const getCompanyInfoBlock = async (id: number): Promise<CompanyInfoBlock> => {
  const response = await apiService.get<CompanyInfoBlock>(`/dashboard/company-info-blocks/${id}`);
  return response.data;
};

export const createCompanyInfoBlock = async (data: {
  title: string;
  description: string;
  is_active: boolean;
}): Promise<CompanyInfoBlock> => {
  const response = await apiService.post<CompanyInfoBlock>('/dashboard/company-info-blocks', data);
  return response.data;
};

export const updateCompanyInfoBlock = async (
  id: number,
  data: {
    title?: string;
    description?: string;
    is_active?: boolean;
  }
): Promise<CompanyInfoBlock> => {
  const response = await apiService.put<CompanyInfoBlock>(`/dashboard/company-info-blocks/${id}`, data);
  return response.data;
};

export const deleteCompanyInfoBlock = async (id: number): Promise<void> => {
  await apiService.delete(`/dashboard/company-info-blocks/${id}`);
};

// Editor Configuration
export const getEditorConfig = async (): Promise<{ apiKey: string }> => {
  const response = await apiService.get<{ apiKey: string }>('/api/dashboard/editor-config');
  return response.data;
};

// Get TinyMCE API key
export const getTinyMCEKey = async (): Promise<string> => {
  try {
    const response = await axios.get<{ value: string }>(`${API_BASE_URL}/dashboard/editor-key`);
    return response.data.value;
  } catch (error) {
    console.error('Error fetching TinyMCE API key:', error);
    throw error;
  }
};

// Company Details
export const getCompanyDetails = async (): Promise<CompanyDetails> => {
  const response = await apiService.get<CompanyDetails>('/dashboard/company-details');
  return response.data;
};

export const updateCompanyDetails = async (data: Partial<CompanyDetails>): Promise<CompanyDetails> => {
  const response = await apiService.put<CompanyDetails>('/dashboard/company-details', data);
  return response.data;
};

// System Settings (System Admin only)
export const getSystemSettings = async () => {
  const response = await apiService.get('/system-admin/settings');
  return response.data;
};

export const createSystemSetting = async (data: {
  key: string;
  value: string;
  is_encrypted: boolean;
}) => {
  const response = await apiService.post('/system-admin/settings', data);
  return response.data;
};

export const updateSystemSetting = async (id: number, data: Partial<{
  key: string;
  value: string;
  is_encrypted: boolean;
}>) => {
  const response = await apiService.put(`/system-admin/settings/${id}`, data);
  return response.data;
};

export default {
    get: apiService.get,
    post: apiService.post,
    put: apiService.put,
    delete: apiService.delete,
    patch: apiService.patch,
    download,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    login,
    register,
    logout,
    refreshToken,
    getCompanyContent,
    createCompanyContent,
    updateCompanyContent,
    deleteCompanyContent,
    getCompanyInfoBlocks,
    getCompanyInfoBlock,
    createCompanyInfoBlock,
    updateCompanyInfoBlock,
    deleteCompanyInfoBlock,
    getEditorConfig,
    getTinyMCEKey,
    getCompanyDetails,
    updateCompanyDetails,
    getSystemSettings,
    createSystemSetting,
    updateSystemSetting
}; 