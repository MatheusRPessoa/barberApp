import { C } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Appointment, appointmentService } from '@/services/appointmentService';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_LABEL: Record<Appointment['appointment_status'], string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<Appointment['appointment_status'], string> = {
    PENDING: C.primary,
    CONFIRMED: C.info,
    COMPLETED: C.success,
    CANCELLED: C.danger,
};

function formatDate(dateStr: string) {
    return dateStr?.split('-').reverse().join('/') ?? '';
}

export default function AppointmentDetails() {
    const router = useRouter();
    const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isBarber = user?.type === 'BARBER';

    const [feedbackMsg, setFeedbackMsg] = useState('');

    const cached = [
        ...(queryClient.getQueryData<Appointment[]>(['appointments-all']) ?? []),
        ...(queryClient.getQueryData<Appointment[]>(['appointments-mine']) ?? []),
    ].find((a) => a.id === appointmentId);

    const { data: listData, isLoading } = useQuery({
        queryKey: isBarber ? ['appointments-all'] : ['appointments-mine'],
        queryFn: isBarber ? () => appointmentService.list() : () => appointmentService.listMine(),
        enabled: !cached,
    });

    const appointment = cached ?? (listData as Appointment[] | undefined)?.find((a) => a.id === appointmentId);

    const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
        mutationFn: (status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') =>
            appointmentService.updateStatus(appointmentId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-mine'] });
            router.back();
        },
        onError: () => setFeedbackMsg('Não foi possível atualizar o agendamento. Tente novamente.'),
    });

    function confirmCancel() {
        Alert.alert('Cancelar agendamento', 'Tem certeza que deseja cancelar este agendamento?', [
            { text: 'Voltar', style: 'cancel' },
            { text: 'Cancelar agendamento', style: 'destructive', onPress: () => updateStatus('CANCELLED') },
        ]);
    }

    const subtotal = (appointment?.services ?? []).reduce((s, svc) => s + Number(svc.price ?? 0), 0);
    const originalPrice = appointment?.original_price ?? subtotal;
    const totalPrice = appointment?.total_price ?? subtotal;
    const coupon = appointment?.coupon;    const status = appointment?.appointment_status;
    const isActive = status === 'PENDING' || status === 'CONFIRMED';

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do agendamento</Text>
            </View>

            {isLoading && !appointment ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator color={C.primary} />
                    <Text style={styles.emptyText}>Carregando...</Text>
                </View>
            ) : !appointment ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="calendar-outline" size={48} color={C.border} />
                    <Text style={styles.emptyText}>Agendamento não encontrado.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardHeaderInfo}>
                                <Text style={styles.mainName}>
                                    {isBarber ? appointment.client?.user?.name : appointment.barber?.shop_name}
                                </Text>
                                <Text style={styles.mainSub}>
                                    {isBarber ? appointment.client?.user?.email : 'Barbearia'}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: STATUS_COLOR[appointment.appointment_status] + '22' },
                                ]}
                            >
                                <Text
                                    style={[styles.badgeText, { color: STATUS_COLOR[appointment.appointment_status] }]}
                                >
                                    {STATUS_LABEL[appointment.appointment_status]}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={16} color={C.textMuted} />
                                <Text style={styles.metaText}>{formatDate(appointment.date)}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={16} color={C.textMuted} />
                                <Text style={styles.metaText}>{appointment.time}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Serviços</Text>
                        {(appointment.services ?? []).map((svc) => (
                            <View key={svc.id} style={styles.serviceRow}>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceName}>{svc.name}</Text>
                                    <Text style={styles.serviceDuration}>{svc.duration_minutes} min</Text>
                                </View>
                                <Text style={styles.servicePrice}>R$ {Number(svc.price ?? 0).toFixed(2)}</Text>
                            </View>
                        ))}
                        {coupon ? (
                            <>
                                <View style={styles.totalRow}>
                                    <Text style={styles.metaText}>Subtotal</Text>
                                    <Text style={styles.metaText}>R$ {originalPrice.toFixed(2)}</Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={[styles.metaText, { color: C.success }]}>
                                        Cupom {coupon.code} (-{coupon.discount_percent}%)
                                    </Text>
                                    <Text style={[styles.metaText, { color: C.success }]}>
                                        - R$ {(originalPrice - totalPrice).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>R$ {totalPrice.toFixed(2)}</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>R$ {totalPrice.toFixed(2)}</Text>
                            </View>
                        )}
                    </View>

                    {feedbackMsg !== '' && (
                        <View style={styles.feedbackBox}>
                            <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
                            <Text style={styles.feedbackText}>{feedbackMsg}</Text>
                        </View>
                    )}

                    {isActive && (
                        <View style={styles.actions}>
                            {isBarber && status === 'PENDING' && (
                                <TouchableOpacity
                                    style={[styles.btnPrimary, updatingStatus && styles.btnDisabled]}
                                    disabled={updatingStatus}
                                    onPress={() => updateStatus('CONFIRMED')}
                                >
                                    <Text style={styles.btnPrimaryText}>Confirmar</Text>
                                </TouchableOpacity>
                            )}
                            {isBarber && status === 'CONFIRMED' && (
                                <TouchableOpacity
                                    style={[styles.btnPrimary, updatingStatus && styles.btnDisabled]}
                                    disabled={updatingStatus}
                                    onPress={() => updateStatus('COMPLETED')}
                                >
                                    <Text style={styles.btnPrimaryText}>Concluir</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.btnCancel, updatingStatus && styles.btnDisabled]}
                                disabled={updatingStatus}
                                onPress={confirmCancel}
                            >
                                <Text style={styles.btnCancelText}>Cancelar agendamento</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bgPage },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: C.bgSurface,
        borderBottomWidth: 1,
        borderBottomColor: C.borderLight,
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: C.bgPage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: C.textPrimary },

    centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyText: { fontSize: 14, color: C.textFaint },

    scroll: { padding: 16, gap: 12 },
    card: { backgroundColor: C.bgSurface, borderRadius: 12, padding: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardHeaderInfo: { flex: 1 },
    mainName: { fontSize: 18, fontWeight: 'bold', color: C.textPrimary },
    mainSub: { fontSize: 13, color: C.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },

    metaRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 14, color: C.textSecondary },

    sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', marginBottom: 10 },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.borderLight,
    },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 15, color: C.textPrimary },
    serviceDuration: { fontSize: 12, color: C.textMuted, marginTop: 1 },
    servicePrice: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    totalLabel: { fontSize: 15, fontWeight: 'bold', color: C.textPrimary },
    totalValue: { fontSize: 15, fontWeight: 'bold', color: C.textPrimary },

    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.danger + '15',
        borderRadius: 10,
        padding: 12,
    },
    feedbackText: { flex: 1, fontSize: 13, color: C.danger },

    actions: { gap: 10, marginTop: 4 },
    btnPrimary: { backgroundColor: C.textPrimary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    btnPrimaryText: { color: C.bgSurface, fontSize: 15, fontWeight: '700' },
    btnCancel: {
        backgroundColor: C.bgSurface,
        borderWidth: 1,
        borderColor: C.danger,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    btnCancelText: { color: C.danger, fontSize: 15, fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
});
