import { api } from "./api";

export interface BarberProfile {
    id: string;
    shop_name: string;
    cnpj: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    type: 'CLIENT' | 'BARBER';
    status?: string;
    barber?: BarberProfile;
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
    CNPJ?: string;
    STREET?: string;
    NUMBER?: string;
    COMPLEMENT?: string;
    NEIGHBORHOOD?: string;
    CITY?: string;
    STATE?: string;
    ZIP_CODE?: string;
}


interface RawAuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

function normalizeAuthResponse(raw: RawAuthResponse): AuthResponse {
    return {
        accessToken: raw.access_token,
        refreshToken: raw.refresh_token,
        user: raw.user,
    };
}

export interface UpdateBarberData {
    NAME?: string;
    SHOP_NAME?: string;
    STREET?: string;
    NUMBER?: string;
    COMPLEMENT?: string | null;
    NEIGHBORHOOD?: string;
    CITY?: string;
    STATE?: string;
    ZIP_CODE?: string;
}

export const authService = {
    login: async (EMAIL: string, PASSWORD: string) => {
        const raw = await api.post<RawAuthResponse>('/auth/login', { EMAIL, PASSWORD }, false);
        console.log('[login] resposta:', JSON.stringify(raw));
        return normalizeAuthResponse(raw);
    },

    register: async (data: RegisterData) => {
        const raw = await api.post<RawAuthResponse>('/auth/register', data, false);
        return normalizeAuthResponse(raw);
    },

    logout: (id: string) =>
        api.post<void>('/auth/logout', { id }, true),

    me: () => api.get<User>('/auth/me'),

    updateBarberProfile: (data: UpdateBarberData) =>
        api.patch<BarberProfile>('/barbers/me', data),
};
