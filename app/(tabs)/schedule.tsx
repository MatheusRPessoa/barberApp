import { C } from '@/constants/Colors';
import { Appointment, appointmentService } from '@/services/appointmentService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator, Alert, RefreshControl,
    ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDateHeader(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const weekdays = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const months   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${weekdays[d.getDay()]}, ${String(day).padStart(2,'0')} ${months[month - 1]}`;
}

export default function Schedule() {
    const router      = useRouter();
    const queryClient = useQueryClient();
    const today       = toDateString(new Date());

    const { data: appointments = [], isLoading: loading, isRefetching, refetch } = useQuery<Appointment[]>({
        queryKey: ['appointments-all'],
        queryFn:  () => appointmentService.list(),
        refetchInterval:      30_000,
        refetchOnWindowFocus: true,
    });

    async function handleUpdateStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
        try {
            await appointmentService.updateStatus(id, status);
            queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
        } catch {
            Alert.alert('Erro', 'Não foi possível atualizar o agendamento.');
        }
    }

    const todayList = appointments
        .filter((a: Appointment) => a.date === today)
        .sort((a: Appointment, b: Appointment) => a.time.localeCompare(b.time));

    const upcoming = appointments
        .filter((a: Appointment) => a.date > today)
        .sort((a: Appointment, b: Appointment) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const upcomingByDate = upcoming.reduce<Record<string, Appointment[]>>((acc: Record<string, Appointment[]>, a: Appointment) => {
        if (!acc[a.date]) acc[a.date] = [];
        acc[a.date].push(a);
        return acc;
    }, {});

    const todayConfirmed = todayList.filter((a: Appointment) => a.appointment_status === 'CONFIRMED').length;
    const todayPending   = todayList.filter((a: Appointment) => a.appointment_status === 'PENDING').length;
    const todayCompleted = todayList.filter((a: Appointment) => a.appointment_status === 'COMPLETED').length;
    const todayCancelled = todayList.filter((a: Appointment) => a.appointment_status === 'CANCELLED').length;

    const statusLabel = (s: Appointment['appointment_status']) =>
        ({ CONFIRMED: 'Confirmado', PENDING: 'Pendente', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' })[s];

    const badgeStyle = (s: Appointment['appointment_status']) =>
        s === 'COMPLETED' ? styles.badgeGreen
        : s === 'CONFIRMED' ? styles.badgeBlue
        : s === 'CANCELLED' ? styles.badgeRed
        : styles.badgeOrange;

    function AppointmentCard({ item }: { item: Appointment }) {
        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <Text style={styles.time}>{item.time}</Text>
                    <View style={styles.cardInfo}>
                        <Text style={styles.clientName}>{item.client?.user?.name}</Text>
                        <Text style={styles.serviceName}>{(item.services ?? []).map(s => s.name).join(' + ')}</Text>
                    </View>
                    <View style={[styles.badge, badgeStyle(item.appointment_status)]}>
                        <Text style={styles.badgeText}>{statusLabel(item.appointment_status)}</Text>
                    </View>
                    <Text style={styles.price}>R$ {(item.services ?? []).reduce((s, svc) => s + Number(svc.price ?? 0), 0).toFixed(2)}</Text>
                </View>
                <View style={styles.cardActions}>
                    {item.appointment_status === 'PENDING' && (
                        <TouchableOpacity style={styles.btnConfirm} onPress={() => handleUpdateStatus(item.id, 'CONFIRMED')}>
                            <Text style={styles.btnConfirmText}>Confirmar</Text>
                        </TouchableOpacity>
                    )}
                    {item.appointment_status === 'CONFIRMED' && (
                        <TouchableOpacity style={styles.btnComplete} onPress={() => handleUpdateStatus(item.id, 'COMPLETED')}>
                            <Text style={styles.btnCompleteText}>Concluir</Text>
                        </TouchableOpacity>
                    )}
                    {(item.appointment_status === 'COMPLETED' || item.appointment_status === 'CANCELLED') && (
                        <TouchableOpacity style={[styles.btnConfirm, styles.btnDisabled]} disabled>
                            <Text style={styles.btnConfirmText}>Confirmar</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.btnCancel, (item.appointment_status === 'COMPLETED' || item.appointment_status === 'CANCELLED') && styles.btnDisabled]}
                        disabled={item.appointment_status === 'COMPLETED' || item.appointment_status === 'CANCELLED'}
                        onPress={() => handleUpdateStatus(item.id, 'CANCELLED')}
                    >
                        <Text style={styles.btnCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) return (
        <SafeAreaView style={styles.safe}>
            <ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} />
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.safe}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agenda</Text>
            </View>
            
            <View style={styles.statsCard}>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: C.success }]}>{todayConfirmed}</Text>
                    <Text style={styles.statLabel}>Confirmados</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: C.primary }]}>{todayPending}</Text>
                    <Text style={styles.statLabel}>Pendentes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: C.info }]}>{todayCompleted}</Text>
                    <Text style={styles.statLabel}>Concluídos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: C.danger }]}>{todayCancelled}</Text>
                    <Text style={styles.statLabel}>Cancelados</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
            >

                <View style={styles.sectionHeader}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionTitle}>Hoje</Text>
                    <Text style={styles.sectionCount}>{todayList.length} agendamento{todayList.length !== 1 ? 's' : ''}</Text>
                </View>

                {todayList.length === 0 ? (
                    <Text style={styles.empty}>Nenhum agendamento para hoje.</Text>
                ) : (
                    todayList.map(item => <AppointmentCard key={item.id} item={item} />)
                )}

                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <View style={[styles.sectionDot, { backgroundColor: C.info }]} />
                    <Text style={styles.sectionTitle}>Próximos Agendamentos</Text>
                    <Text style={styles.sectionCount}>{upcoming.length} agendamento{upcoming.length !== 1 ? 's' : ''}</Text>
                </View>

                {upcoming.length === 0 ? (
                    <Text style={styles.empty}>Nenhum agendamento futuro.</Text>
                ) : (
                    Object.entries(upcomingByDate).map(([date, items]) => (
                        <View key={date}>
                            <View style={styles.dateHeader}>
                                <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
                                <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
                            </View>
                            {items.map(item => <AppointmentCard key={item.id} item={item} />)}
                        </View>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:             { flex: 1, backgroundColor: C.bgPage },
    header:           { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.bgSurface, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 12 },
    headerTitle:      { flex: 1, fontSize: 18, fontWeight: 'bold', color: C.textPrimary },

    statsCard:        { flexDirection: 'row', backgroundColor: C.bgSurface, marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingVertical: 14, marginBottom: 4 },
    stat:             { flex: 1, alignItems: 'center' },
    statNum:          { fontSize: 20, fontWeight: 'bold' },
    statLabel:        { fontSize: 11, color: C.textMuted, marginTop: 3 },
    statDivider:      { width: 1, backgroundColor: C.bgDivider, marginVertical: 4 },

    scroll:           { padding: 16, paddingBottom: 40 },

    sectionHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
    sectionTitle:     { fontSize: 16, fontWeight: 'bold', color: C.textPrimary, flex: 1 },
    sectionCount:     { fontSize: 12, color: C.textFaint },

    dateHeader:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 6, marginTop: 4 },
    dateHeaderText:   { fontSize: 13, fontWeight: '600', color: C.textSecondary },

    empty:            { textAlign: 'center', color: C.textFaint, marginTop: 16, marginBottom: 8, fontSize: 13 },

    card:             { backgroundColor: C.bgSurface, borderRadius: 12, padding: 16, marginBottom: 10 },
    cardTop:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    time:             { fontSize: 14, fontWeight: '700', color: C.textTertiary, width: 44 },
    cardInfo:         { flex: 1 },
    clientName:       { fontSize: 15, fontWeight: '700', color: C.textPrimary },
    serviceName:      { fontSize: 13, color: C.textMuted, marginTop: 2 },
    badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeGreen:       { backgroundColor: C.success },
    badgeBlue:        { backgroundColor: C.info },
    badgeOrange:      { backgroundColor: C.primary },
    badgeRed:         { backgroundColor: C.danger },
    badgeText:        { color: C.bgSurface, fontSize: 11, fontWeight: '700' },
    price:            { fontSize: 15, fontWeight: '700', color: C.textPrimary },

    cardActions:      { flexDirection: 'row', gap: 10 },
    btnConfirm:       { flex: 1, backgroundColor: C.success, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    btnConfirmText:   { color: C.bgSurface, fontWeight: '600', fontSize: 14 },
    btnCancel:        { flex: 1, backgroundColor: C.danger, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    btnCancelText:    { color: C.bgSurface, fontWeight: '600', fontSize: 14 },
    btnDisabled:      { backgroundColor: C.bgDisabled },
    btnComplete:      { flex: 1, backgroundColor: C.info, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    btnCompleteText:  { color: C.bgSurface, fontWeight: '600', fontSize: 14 },
});
