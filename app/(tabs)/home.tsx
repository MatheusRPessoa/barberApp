import { C } from '@/constants/Colors';
import { Appointment, appointmentService } from '@/services/appointmentService';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlaceHolderImage from '@/components/PlaceholderImage';

function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export default function Home() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [modalVisible, setModalVisible] = useState(false);
    const [clientName, setClientName] = useState('');
    const [service, setService] = useState('');
    const [time, setTime] = useState('');

    const today = toDateString(new Date());

    const {
        data: appointments = [],
        isLoading: loading,
        isRefetching,
        refetch,
    } = useQuery<Appointment[]>({
        queryKey: ['appointments-all'],
        queryFn: () => appointmentService.list(),
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });

    const onRefresh = () => {
        refetch();
    };

    async function handleUpdateStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
        try {
            await appointmentService.updateStatus(id, status);
            queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
        } catch {
            Alert.alert('Erro', 'Não foi possível atualizar o agendamento.');
        }
    }

    const todayAppointments = appointments.filter((a) => a.date === today);

    const todayEarnings = todayAppointments
        .filter((a) => a.appointment_status === 'COMPLETED')
        .reduce((sum, a) => sum + (a.services ?? []).reduce((s, svc) => s + Number(svc.price ?? 0), 0), 0);

    const upcoming = appointments
        .filter((a) => a.date >= today && (a.appointment_status === 'PENDING' || a.appointment_status === 'CONFIRMED'))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const nextAppointment = upcoming[0];

    const statusLabel = (s: Appointment['appointment_status']) =>
        ({ CONFIRMED: 'Confirmado', PENDING: 'Pendente', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' })[s];

    const badgeStyle = (s: Appointment['appointment_status']) =>
        s === 'COMPLETED'
            ? styles.badgeGreen
            : s === 'CONFIRMED'
              ? styles.badgeBlue
              : s === 'CANCELLED'
                ? styles.badgeGrey
                : styles.badgeOrange;

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <PlaceHolderImage style={styles.avatar} logoSize={20} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.shopName}>{user?.name}</Text>
                        <Text style={styles.subtitle}>Barbeiro</Text>
                    </View>
                    <TouchableOpacity onPress={logout}>
                        <Ionicons name="log-out-outline" size={24} color={C.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Agendamentos hoje</Text>
                        <Text style={styles.statValue}>{todayAppointments.length}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Ganhos hoje</Text>
                        <Text style={styles.statValue}>R$ {todayEarnings.toFixed(2)}</Text>
                    </View>
                </View>

                {nextAppointment ? (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => 
                            router.push({ pathname: '/appointment-details', params: { appointmentId: nextAppointment.id } })
                        }
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Próximo Agendamento</Text>
                            <Text style={styles.infoOrange}>{nextAppointment.time}</Text>
                        </View>
                        <View style={styles.appointmentRow}>
                            <PlaceHolderImage style={styles.avatarSm} logoSize={16} />
                            <View style={styles.appointmentInfo}>
                                <Text style={styles.appointmentName}>{nextAppointment.client?.user?.name}</Text>
                                <Text style={styles.appointmentService}>
                                    {nextAppointment.services?.map((s) => s.name).join(' + ')}
                                </Text>
                            </View>
                            <Text style={styles.appointmentTime}>{nextAppointment.time}</Text>
                        </View>
                        <View style={styles.actionRow}>
                            {nextAppointment.appointment_status === 'PENDING' && (
                                <TouchableOpacity
                                    style={styles.actionBtnConfirm}
                                    onPress={() => handleUpdateStatus(nextAppointment.id, 'CONFIRMED')}
                                >
                                    <Text style={styles.actionBtnText}>Confirmar</Text>
                                </TouchableOpacity>
                            )}
                            {nextAppointment.appointment_status === 'CONFIRMED' && (
                                <TouchableOpacity
                                    style={styles.actionBtnComplete}
                                    onPress={() => handleUpdateStatus(nextAppointment.id, 'COMPLETED')}
                                >
                                    <Text style={styles.actionBtnText}>Concluir</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.actionBtnCancel}
                                onPress={() => handleUpdateStatus(nextAppointment.id, 'CANCELLED')}
                            >
                                <Text style={styles.actionBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.card}>
                        <Text style={styles.emptyText}>Nenhum agendamento próximo</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Próximos Agendamentos</Text>
                        <TouchableOpacity onPress={() => router.push('/schedule')}>
                            <Text style={styles.seeAll}>Ver tudo</Text>
                        </TouchableOpacity>
                    </View>

                    {upcoming.length === 0 ? (
                        <Text style={styles.emptyText}>Nenhum agendamento próximo</Text>
                    ) : (
                        upcoming.slice(0, 4).map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={styles.scheduleItem}
                                activeOpacity={0.7}
                                onPress={() => 
                                    router.push({
                                        pathname: '/appointment-details',
                                        params: { appointmentId: item.id },
                                    })
                                }
                            >
                                <View style={styles.scheduleTimeCol}>
                                    {item.date !== today && (
                                        <Text style={styles.scheduleDate}>
                                            {item.date.split('-').reverse().slice(0, 2).join('/')}
                                        </Text>
                                    )}
                                    <Text style={styles.scheduleTime}>{item.time}</Text>
                                </View>
                                <View style={styles.scheduleInfo}>
                                    <Text style={styles.scheduleName}>{item.client?.user?.name}</Text>
                                    <Text style={styles.scheduleService}>
                                        {(item.services ?? []).map((s) => s.name).join(' + ')}
                                    </Text>
                                </View>
                                <View style={[styles.badge, badgeStyle(item.appointment_status)]}>
                                    <Text style={styles.badgeText}>{statusLabel(item.appointment_status)}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalVisible(true)}>
                    <Ionicons name="calendar-outline" size={18} color={C.bgSurface} />
                    <Text style={styles.btnPrimaryText}>Novo Agendamento</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/schedule')}>
                    <Ionicons name="time-outline" size={18} color={C.textTertiary} />
                    <Text style={styles.btnSecondaryText}>Ver Agenda</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
                transparent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Novo Agendamento</Text>

                        <Text style={styles.modalLabel}>Nome do Cliente</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex: João Silva"
                            value={clientName}
                            onChangeText={setClientName}
                        />

                        <Text style={styles.modalLabel}>Serviço</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex: Corte + Barba"
                            value={service}
                            onChangeText={setService}
                        />

                        <Text style={styles.modalLabel}>Horário</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex: 15:00"
                            value={time}
                            onChangeText={setTime}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnConfirm}
                                onPress={() => {
                                    Alert.alert('Agendamento criado!', `${clientName} - ${service} às ${time}`);
                                    setClientName('');
                                    setService('');
                                    setTime('');
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalBtnConfirmText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: C.bgPage },
    scroll: { padding: 16, paddingBottom: 32 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.borderInput, marginRight: 12 },
    shopName: { fontSize: 18, fontWeight: 'bold', color: C.textPrimary },
    subtitle: { fontSize: 13, color: C.textMuted, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: C.navyStatCard, borderRadius: 12, padding: 16 },
    statLabel: { color: C.textOnNavy, fontSize: 13, marginBottom: 8 },
    statValue: { color: C.bgSurface, fontSize: 24, fontWeight: 'bold' },
    card: { backgroundColor: C.bgSurface, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: C.textPrimary },
    infoOrange: { color: C.primary, fontSize: 13, fontWeight: '600' },
    seeAll: { color: C.textSecondary, fontSize: 13 },
    appointmentRow: { flexDirection: 'row', alignItems: 'center' },
    avatarSm: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.borderInput, marginRight: 12 },
    appointmentInfo: { flex: 1 },
    appointmentName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
    appointmentService: { fontSize: 13, color: C.textMuted, marginTop: 2 },
    appointmentTime: { fontSize: 16, fontWeight: 'bold', color: C.primary },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: C.bgDivider,
    },
    scheduleTimeCol: { width: 48, alignItems: 'flex-start' },
    scheduleTime: { fontSize: 13, fontWeight: '600', color: C.primary },
    scheduleDate: { fontSize: 10, color: C.textFaint, marginBottom: 1 },
    scheduleInfo: { flex: 1, marginLeft: 8 },
    scheduleName: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    scheduleService: { fontSize: 12, color: C.textMuted, marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeGreen: { backgroundColor: C.success },
    badgeOrange: { backgroundColor: C.primary },
    badgeBlue: { backgroundColor: C.info },
    badgeGrey: { backgroundColor: C.textFaint },
    badgeText: { color: C.bgSurface, fontSize: 11, fontWeight: '600' },
    footer: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: C.bgPage },
    btnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.primary,
        borderRadius: 10,
        paddingVertical: 14,
        gap: 8,
    },
    btnPrimaryText: { color: C.bgSurface, fontWeight: '700', fontSize: 10 },
    btnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.bgSurface,
        borderRadius: 10,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: C.border,
        gap: 8,
    },
    btnSecondaryText: { color: C.textTertiary, fontWeight: '600', fontSize: 10 },
    emptyText: { color: C.textFaint, textAlign: 'center', paddingVertical: 8 },
    modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
    modalBox: {
        backgroundColor: C.bgSurface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: C.textPrimary, marginBottom: 20 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: C.textLabel, marginBottom: 6 },
    modalInput: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtnCancel: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
    },
    modalBtnCancelText: { color: C.textSecondary, fontWeight: '600' },
    modalBtnConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center' },
    modalBtnConfirmText: { color: C.bgSurface, fontWeight: '700' },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    actionBtnConfirm: {
        flex: 1,
        backgroundColor: C.success,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    actionBtnComplete: { flex: 1, backgroundColor: C.info, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    actionBtnCancel: { flex: 1, backgroundColor: C.danger, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    actionBtnText: { color: C.bgSurface, fontWeight: '700', fontSize: 14 },
});
