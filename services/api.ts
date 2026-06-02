import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3001/api';

async function tryRefreshToken(): Promise<string | null> {
    try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) return null;

        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        const newAccess  = data.access_token  ?? data.accessToken;
        const newRefresh = data.refresh_token ?? data.refreshToken;

        if (!newAccess) return null;

        await AsyncStorage.setItem('accessToken', newAccess);
        if (newRefresh) await AsyncStorage.setItem('refreshToken', newRefresh);

        return newAccess;
    } catch {
        return null;
    }
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    useAuth = true
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (useAuth) {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401 && useAuth) {
        const newToken = await tryRefreshToken();
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
        } else {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            throw new Error('Sessão expirada. Faça login novamente.');
        }
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erro na requisição');
    }

    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as unknown as T);
}

export const api = {
    get: <T>(path: string, useAuth = true) =>
        request<T>(path, { method: 'GET' }, useAuth),
    post: <T>(path: string, body: unknown, useAuth = true) =>
        request<T>(path, { method: 'POST', body: JSON.stringify(body) }, useAuth),
    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(path: string) =>
        request<T>(path, { method: 'DELETE' }),
};