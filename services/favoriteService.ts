import { api } from './api';
import { BarberShop } from './barberService';

export const favoriteService = {
    add: (barberId: string) => api.post<void>(`/clients/me/favorites/${barberId}`, {}),
    remove: (barberId: string) => api.delete<void>(`/clients/me/favorites/${barberId}`),
    list: (coords?: { lat: number; lng: number }) => {
        const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
        return api.get<BarberShop[]>(`/clients/me/favorites${qs}`);
    },
};
