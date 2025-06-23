import axios, { InternalAxiosRequestConfig } from 'axios';

const apiService = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiService.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
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


export default {
    get: apiService.get,
    post: apiService.post,
    put: apiService.put,
    delete: apiService.delete,
    patch: apiService.patch,
    download,
}; 