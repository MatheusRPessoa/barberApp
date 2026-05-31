import { api } from "./api";

export interface User {
    id: string;
    name: string;
    email: string;
    type: 'CLIENT' | 'BARBER';
    status?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RegisterData {
    NAME: string;
    EMAIL: string;
    PASSWORD: string;
    TYPE: 'CLIENT' | 'BARBER';
    SHOP_NAME?: string;
}

export const authService = {
    login: (EMAIL: string, PASSWORD: string) =>
        api.post<AuthResponse>('/auth/login', { EMAIL, PASSWORD }, false),

    register: (data: RegisterData) =>
        api.post<AuthResponse>('/auth/register', data, false),

    logout: (id: string) =>
        api.post<void>('/auth/logout', { id }, true),

    me: () =>
        api.get<User>('/auth/me'),
};