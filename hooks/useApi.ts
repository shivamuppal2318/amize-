import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import apiClient from '../lib/api/client';

// Type for the hook's return value
interface UseApiResult<T, P> {
    data: T | null;
    error: string | null;
    loading: boolean;
    execute: (params?: P) => Promise<T | null>;
}

// Generic hook for API calls
export function useApi<T = any, P = any>(
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete' = 'get'
): UseApiResult<T, P> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const execute = useCallback(
        async (params?: P): Promise<T | null> => {
            try {
                setLoading(true);
                setError(null);

                let response;

                console.log(`Executing API call: ${method.toUpperCase()} ${endpoint}`);
                console.log('Parameters:', params);

                // Handle different HTTP methods
                switch (method) {
                    case 'get':
                        response = await apiClient.get<T>(endpoint, { params });
                        break;
                    case 'post':
                        response = await apiClient.post<T>(endpoint, params);
                        break;
                    case 'put':
                        response = await apiClient.put<T>(endpoint, params);
                        break;
                    case 'delete':
                        response = await apiClient.delete<T>(endpoint, { data: params });
                        break;
                }

                setData(response.data);
                return response.data;
            } catch (err) {
                console.error(`API Error (${method.toUpperCase()} ${endpoint}):`, err);

                if (axios.isAxiosError(err)) {
                    const axiosError = err as AxiosError<any>;
                    const errorMessage = axiosError.response?.data?.message || axiosError.message;
                    setError(errorMessage);
                } else {
                    setError('An unexpected error occurred');
                }

                return null;
            } finally {
                setLoading(false);
            }
        },
        [endpoint, method]
    );

    return { data, error, loading, execute };
}