import { api } from './api';

export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    client: { name: string };
}

export const reviewService = {
    listByBarber: (barberId: string) => api.get<Review[]>(`/barbers/${barberId}/reviews`, false),
};
