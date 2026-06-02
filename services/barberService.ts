import { api } from './api';

export interface BarberShop {
    id: string;
    shop_name: string;
    rating: number;
    street: string;
    city: string;
    state: string;
    services: Service[];
}

export interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}

export interface CreateServiceData {
    NAME: string;
    PRICE: number;
    DURATION_MINUTES: number;
}

export interface UpdateServiceData {
    NAME?: string;
    PRICE?: number;
    DURATION_MINUTES?: number;
}

export const barberService = {
    listBarbers: () =>
        api.get<BarberShop[]>('/barbers', false),

    listBarberServices: (barberId: string) =>
        api.get<Service[]>(`/barbers/${barberId}/services`, false),

    getAvailableSlots: (barberId: string, date: string) =>
        api.get<{ date: string; available: string[] }>(`/barbers/${barberId}/available-slots?date=${date}`, false),

    listMyServices: () =>
        api.get<Service[]>('/services/mine'),

    createService: (data: CreateServiceData) =>
        api.post<Service>('/services', data),

    updateService: (id: string, data: UpdateServiceData) =>
        api.patch<Service>(`/services/${id}`, data),

    deleteService: (id: string) =>
        api.delete<void>(`/services/${id}`),
};
