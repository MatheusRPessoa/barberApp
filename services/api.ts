import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3001/api';

async function request<T>(
    path: string,
    options: RequestInit = {},
    useAuth = true
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type' : 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (useAuth) {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erro na requisição');
    }

    return res.json()
}

export const api = {
    get: <T>(path: string, useAuth = true) =>
        request<T>(path, { method: 'GET' }, useAuth),
    post: <T>(path: string, body: unknown, useAuth = true) =>
        request<T>(path, { method: 'POST', body: JSON.stringify(body) }, useAuth),
    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};