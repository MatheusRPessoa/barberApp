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
    service: AppointmentService;
    date: string;
    time: string;
    appointment_status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
    status: string;
}

interface ListParams {
    date?: string;
    status?: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
}

function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

export const appointmentService = {
    list: (params: ListParams = {}) => {
        const query = new URLSearchParams();
        if (params.date)   query.append('date', params.date);
        if (params.status) query.append('status', params.status);
        const qs = query.toString();
        return api.get<Appointment[]>(`/appointments${qs ? `?${qs}` : ''}`);
    },

    listToday: () =>
        appointmentService.list({ date: toDateString(new Date()) }),

    updateStatus: (id: string, STATUS: 'COMPLETED' | 'CANCELLED') =>
        api.patch<void>(`/appointments/${id}/status`, { STATUS }),
};
