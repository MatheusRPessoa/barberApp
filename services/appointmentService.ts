import { api } from './api';

export interface AppointmentClient {
    id: string;
    user: { id: string; name: string; email: string };
}

export interface AppointmentService {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}

export interface Appointment {
    id: string;
    barber: { id: string; shop_name: string };
    client: AppointmentClient;
    services: AppointmentService[];
    date: string;
    time: string;
    appointment_status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    status: string;
}

interface ListParams {
    date?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

function toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const appointmentService = {
    list: (params: ListParams = {}) => {
        const query = new URLSearchParams();
        if (params.date) query.append('date', params.date);
        if (params.status) query.append('status', params.status);
        const qs = query.toString();
        return api.get<Appointment[]>(`/appointments${qs ? `?${qs}` : ''}`);
    },

    listToday: () => appointmentService.list({ date: toDateString(new Date()) }),

    updateStatus: (id: string, STATUS: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') =>
        api.patch<void>(`/appointments/${id}/status`, { STATUS }),

    create: (data: { BARBER_ID: string; SERVICE_IDS: string[]; DATE: string; TIME: string }) =>
        api.post<Appointment>('/appointments', data),

    listMine: () => api.get<Appointment[]>('/appointments/mine'),
};
