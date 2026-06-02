import { Appointment, appointmentService } from '@/services/appointmentService';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const FILTERS: { label: string; value: StatusFilter }[] = [
    { label: 'Todos',      value: 'ALL' },
    { label: 'Pendente',   value: 'PENDING' },
    { label: 'Confirmado', value: 'CONFIRMED' },
    { label: 'Concluído',  value: 'COMPLETED' },
    { label: 'Cancelado',  value: 'CANCELLED' },
];

const STATUS_LABEL: Record<Appointment['appointment_status'], string> = {
    PENDING:   'Pendente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<Appointment['appointment_status'], string> = {
    PENDING:   '#ffb300',
    CONFIRMED: '#007bff',
    COMPLETED: '#28a745',
    CANCELLED: '#dc3545',
};

// Badge pulsante para statuses ativos
function PulsingBadge({ status }: { status: Appointment['appointment_status'] }) {
    const scale = useRef(new Animated.Value(1)).current;
    const active = status === 'PENDING';

    useEffect(() => {
        if (!active) return;
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.1, duration: 700, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1,   duration: 700, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [active]);

    return (
        <Animated.View style={[
            styles.badge,
            { backgroundColor: STATUS_COLOR[status] + '22', transform: [{ scale }] },
        ]}>
            {active && <View style={[styles.badgeDot, { backgroundColor: STATUS_COLOR[status] }]} />}
            <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
                {STATUS_LABEL[status]}
            </Text>
        </Animated.View>
    );
}

export default function MyAppointments() {
    const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
    const [changedIds, setChangedIds]     = useState<Set<string>>(new Set());
    const prevStatusRef                   = useRef<Record<string, string>>({});

    // Animação do indicador de sync
    const syncAnim = useRef(new Animated.Value(0.3)).current;
    const syncLoop = useRef<Animated.CompositeAnimation | null>(null);

    const { data: appointments = [], isLoading: loading, isFetching, refetch } = useQuery<Appointment[]>({
        queryKey: ['appointments-mine'],
        queryFn:  () => appointmentService.listMine(),
        refetchInterval:      15_000,
        refetchOnWindowFocus: true,
    });

    // Animação do ponto de sync ligada ao isFetching
    useEffect(() => {
        if (isFetching && !loading) {
            syncLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(syncAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
                    Animated.timing(syncAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
                ])
            );
            syncLoop.current.start();
        } else {
            syncLoop.current?.stop();
            Animated.timing(syncAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }
    }, [isFetching, loading]);

    // Detectar mudanças de status
    useEffect(() => {
        const prev = prevStatusRef.current;
        const changed = new Set<string>();
        appointments.forEach((a: Appointment) => {
            if (prev[a.id] && prev[a.id] !== a.appointment_status) changed.add(a.id);
            prev[a.id] = a.appointment_status;
        });
        if (changed.size > 0) {
            setChangedIds(changed);
            setTimeout(() => setChangedIds(new Set()), 3000);
        }
    }, [appointments]);

    const filtered = activeFilter === 'ALL'
        ? appointments
        : appointments.filter((a: Appointment) => a.appointment_status === activeFilter);

    return (
        <SafeAreaView style={styles.safe}>

            {/* Header com indicador de sync */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meus Agendamentos</Text>
                <Animated.View style={[styles.syncDot, { opacity: syncAnim }]}>
                    <View style={styles.syncDotInner} />
                </Animated.View>
                {isFetching && !loading && <Text style={styles.syncLabel}>atualizando...</Text>}
            </View>

            {/* Filtros */}
            <View style={styles.filtersWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                    {FILTERS.map(f => (
                        <TouchableOpacity
                            key={f.value}
                            style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
                            onPress={() => setActiveFilter(f.value)}
                        >
                            <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.listScroll}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
            >
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Carregando...</Text>
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={48} color="#ddd" />
                        <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
                    </View>
                ) : (
                    filtered.map(item => {
                        const justChanged = changedIds.has(item.id);
                        return (
                            <View key={item.id} style={[styles.card, justChanged && styles.cardChanged]}>
                                {justChanged && (
                                    <View style={styles.changedBanner}>
                                        <Ionicons name="checkmark-circle" size={14} color="#007bff" />
                                        <Text style={styles.changedText}>Status atualizado!</Text>
                                    </View>
                                )}
                                <View style={styles.cardLeft}>
                                    <View style={styles.dateBox}>
                                        <Text style={styles.dateDay}>{item.date?.split('-')[2]}</Text>
                                        <Text style={styles.dateMonth}>
                                            {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(item.date?.split('-')[1]) - 1]}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.cardBody}>
                                    <Text style={styles.shopName}>{item.barber?.shop_name}</Text>
                                    <Text style={styles.serviceName}>{item.service?.name}</Text>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="time-outline" size={13} color="#888" />
                                        <Text style={styles.metaText}>{item.time}</Text>
                                        <Text style={styles.metaSep}>·</Text>
                                        <Text style={styles.metaText}>R$ {Number(item.service?.price ?? 0).toFixed(2)}</Text>
                                    </View>
                                </View>
                                <PulsingBadge status={item.appointment_status} />
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:             { flex: 1, backgroundColor: '#f5f5f5' },
    header:           { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle:      { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', flex: 1 },
    syncDot:          { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    syncDotInner:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007bff' },
    syncLabel:        { fontSize: 11, color: '#007bff' },

    filtersWrapper:   { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    filtersRow:       { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
    filterChip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee', marginRight: 8 },
    filterChipActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
    filterText:       { fontSize: 13, color: '#666' },
    filterTextActive: { color: '#fff', fontWeight: '600' },

    listScroll:       { flex: 1 },
    scroll:           { padding: 16, paddingBottom: 32 },
    emptyContainer:   { alignItems: 'center', marginTop: 60 },
    emptyText:        { color: '#aaa', fontSize: 14, marginTop: 10 },

    card:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, gap: 12 },
    cardChanged:      { borderWidth: 2, borderColor: '#007bff' },
    changedBanner:    { position: 'absolute', top: -1, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e8f0fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    changedText:      { fontSize: 11, color: '#007bff', fontWeight: '600' },

    cardLeft:         {},
    dateBox:          { width: 48, height: 52, backgroundColor: '#f5f5f5', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    dateDay:          { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
    dateMonth:        { fontSize: 11, color: '#888', marginTop: 1 },
    cardBody:         { flex: 1 },
    shopName:         { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
    serviceName:      { fontSize: 13, color: '#666', marginTop: 2 },
    metaRow:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    metaText:         { fontSize: 12, color: '#888' },
    metaSep:          { fontSize: 12, color: '#ccc' },

    badge:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 },
    badgeDot:         { width: 7, height: 7, borderRadius: 4 },
    badgeText:        { fontSize: 11, fontWeight: '700' },
});
