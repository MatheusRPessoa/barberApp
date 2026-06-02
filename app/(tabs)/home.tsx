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

export default function Home() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [modalVisible, setModalVisible] = useState(false);
    const [clientName, setClientName] = useState('');
    const [service, setService] = useState('');
    const [time, setTime] = useState('');

    const { data: appointments = [], isLoading: loading, isRefetching, refetch } = useQuery<Appointment[]>({
        queryKey: ['appointments-today'],
        queryFn:  () => appointmentService.listToday(),
        refetchInterval:      30_000,
        refetchOnWindowFocus: true,
    });

    const onRefresh = () => { refetch(); };

    async function handleUpdateStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
        try {
            await appointmentService.updateStatus(id, status);
            queryClient.invalidateQueries({ queryKey: ['appointments-today'] });
        } catch {
            Alert.alert('Erro', 'Não foi possível atualizar o agendamento.');
        }
    }

    const todayEarnings = appointments
        .filter(a => a.appointment_status === 'COMPLETED')
        .reduce((sum, a) => sum + (a.services ?? []).reduce((s, svc) => s + Number(svc.price ?? 0), 0), 0);

    const nextAppointment = appointments.find(a => a.appointment_status === 'PENDING' || a.appointment_status === 'CONFIRMED')

    const statusLabel = (s: Appointment['appointment_status']) =>
        ({ CONFIRMED: 'Confirmado', PENDING: 'Pendente', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' })[s];

    const badgeStyle = (s: Appointment['appointment_status']) =>
        s === 'COMPLETED' ? styles.badgeGreen
        : s === 'CONFIRMED' ? styles.badgeBlue
        : s === 'CANCELLED' ? styles.badgeGrey
        : styles.badgeOrange;

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator style={{ flex: 1 }} size="large" color="#ffb300" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.shopName}>{user?.name}</Text>
                        <Text style={styles.subtitle}>Barbeiro</Text>
                    </View>
                    <TouchableOpacity onPress={logout}>
                        <Ionicons name="log-out-outline" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Agendamentos hoje</Text>
                        <Text style={styles.statValue}>{appointments.length}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Ganhos hoje</Text>
                        <Text style={styles.statValue}>
                            R$ {todayEarnings.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {nextAppointment ? (
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Próximo Agendamento</Text>
                            <Text style={styles.infoOrange}>{nextAppointment.time}</Text>
                        </View>
                        <View style={styles.appointmentRow}>
                            <View style={styles.avatarSm} />
                            <View style={styles.appointmentInfo}>
                                <Text style={styles.appointmentName}>
                                    {nextAppointment.client?.user?.name}
                                </Text>
                                <Text style={styles.appointmentService}>
                                    {nextAppointment.services?.map(s => s.name).join(' + ')}
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
                    </View>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.emptyText}>Nenhum agendamento próximo</Text>
                    </View>
                )}

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Agenda de Hoje</Text>
                        <TouchableOpacity onPress={() => router.push('/schedule')}>
                            <Text style={styles.seeAll}>Ver tudo</Text>
                        </TouchableOpacity>
                    </View>

                    {appointments.length === 0 ? (
                        <Text style={styles.emptyText}>Nenhum agendamento hoje</Text>
                    ) : (
                        appointments.slice(0, 4).map(item => (
                            <View key={item.id} style={styles.scheduleItem}>
                                <Text style={styles.scheduleTime}>{item.time}</Text>
                                <View style={styles.scheduleInfo}>
                                    <Text style={styles.scheduleName}>
                                        {item.client?.user?.name}
                                    </Text>
                                    <Text style={styles.scheduleService}>
                                        {(item.services ?? []).map(s => s.name).join(' + ')}
                                    </Text>
                                </View>
                                <View style={[styles.badge, badgeStyle(item.appointment_status)]}>
                                    <Text style={styles.badgeText}>
                                        {statusLabel(item.appointment_status)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalVisible(true)}>
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Novo Agendamento</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/schedule')}>
                    <Ionicons name="time-outline" size={18} color="#333" />
                    <Text style={styles.btnSecondaryText}>Ver Agenda</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
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
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setModalVisible(false)}
                            >
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
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    scroll: { padding: 16, paddingBottom: 32 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ccc', marginRight: 12 },
    shopName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#1e2a3a', borderRadius: 12, padding: 16 },
    statLabel: { color: '#a0aec0', fontSize: 13, marginBottom: 8 },
    statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    infoOrange: { color: '#ffb300', fontSize: 13, fontWeight: '600' },
    seeAll: { color: '#666', fontSize: 13 },
    appointmentRow: { flexDirection: 'row', alignItems: 'center' },
    avatarSm: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', marginRight: 12 },
    appointmentInfo: { flex: 1 },
    appointmentName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    appointmentService: { fontSize: 13, color: '#888', marginTop: 2 },
    appointmentTime: { fontSize: 16, fontWeight: 'bold', color: '#ffb300' },
    scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    scheduleTime: { width: 48, fontSize: 13, fontWeight: '600', color: '#ffb300' },
    scheduleInfo: { flex: 1, marginLeft: 8 },
    scheduleName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
    scheduleService: { fontSize: 12, color: '#888', marginTop: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeGreen: { backgroundColor: '#28a745' },
    badgeOrange: { backgroundColor: '#ffb300' },
    badgeBlue: { backgroundColor: '#007bff' },
    badgeGrey: { backgroundColor: '#aaa' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    footer: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#f5f5f5' },
    btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffb300', borderRadius: 10, paddingVertical: 14, gap: 8 },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 10 },
    btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, borderWidth: 1, borderColor: '#ddd', gap: 8 },
    btnSecondaryText: { color: '#333', fontWeight: '600', fontSize: 10 },
    emptyText: { color: '#aaa', textAlign: 'center', paddingVertical: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
    modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtnCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    modalBtnCancelText: { color: '#666', fontWeight: '600' },
    modalBtnConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#ffb300', alignItems: 'center' },
    modalBtnConfirmText: { color: '#fff', fontWeight: '700' },

    actionRow:         { flexDirection: 'row', gap: 10, marginTop: 14 },
    actionBtnConfirm:  { flex: 1, backgroundColor: '#28a745', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    actionBtnComplete: { flex: 1, backgroundColor: '#007bff', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    actionBtnCancel:   { flex: 1, backgroundColor: '#dc3545', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    actionBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
});
