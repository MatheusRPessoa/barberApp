import { useNotificationsContext } from '@/context/NotificationsContext';
import { Appointment } from '@/services/appointmentService';
import { useEffect, useRef } from 'react';

const STATUS_LABEL: Record<Appointment['appointment_status'], string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
};

export function useAppointmentAlerts(appointments: Appointment[], ready: boolean, isBarber: boolean) {
    const { addNotification } = useNotificationsContext();
    const seenRef = useRef<Record<string, string> | null>(null);

    useEffect(() => {
        if (!ready) return;

        const snapshot = Object.fromEntries(appointments.map((a) => [a.id, a.appointment_status]));
        const prev = seenRef.current;

        if (prev === null) {
            seenRef.current = snapshot;
            return;
        }

        appointments.forEach((a) => {
            const quem = isBarber ? (a.client?.user?.name ?? 'Cliente') : (a.barber?.shop_name ?? 'Barbearia');
            if (!(a.id in prev)) {
                // Só o barbeiro é avisado de agendamento novo (o cliente foi quem criou)
                if (isBarber) {
                    addNotification({
                        title: 'Novo agendamento',
                        body: `${quem} — ${a.date.split('-').reverse().join('/')} às ${a.time}`,
                        data: { appointmentId: a.id },
                    });
                }
            } else if (prev[a.id] !== a.appointment_status) {
                addNotification({
                    title: 'Agendamento atualizado',
                    body: `${quem} — ${STATUS_LABEL[a.appointment_status]}`,
                    data: { appointmentId: a.id },
                });
            }
        });

        seenRef.current = snapshot;
    }, [appointments, ready, isBarber, addNotification]);
}
