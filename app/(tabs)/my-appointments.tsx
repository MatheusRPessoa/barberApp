import ReviewModal from '@/components/ReviewModal';
import { C } from '@/constants/Colors';
import { useNotificationsContext } from '@/context/NotificationsContext';
import { router, useRouter } from 'expo-router';
import { Appointment, appointmentService } from '@/services/appointmentService';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const FILTERS: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Pendente', value: 'PENDING' },
    { label: 'Confirmado', value: 'CONFIRMED' },
    { label: 'Concluído', value: 'COMPLETED' },
    { label: 'Cancelado', value: 'CANCELLED' },
];

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

function PulsingBadge({ status }: { status: Appointment['appointment_status'] }) {
    const scale = useRef(new Animated.Value(1)).current;
    const active = status === 'PENDING';

    useEffect(() => {
        if (!active) return;
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.1, duration: 700, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [active, scale]);

    return (
        <Animated.View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] + '22', transform: [{ scale }] }]}>
            {active && <View style={[styles.badgeDot, { backgroundColor: STATUS_COLOR[status] }]} />}
            <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>{STATUS_LABEL[status]}</Text>
        </Animated.View>
    );
}

export default function MyAppointments() {
    const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
    const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
    const prevStatusRef = useRef<Record<string, string>>({});
    const { addNotification } = useNotificationsContext();
    const [reviewing, setReviewing] = useState<Appointment | null>(null);

    const syncAnim = useRef(new Animated.Value(0.3)).current;
    const syncLoop = useRef<Animated.CompositeAnimation | null>(null);

    const {
        data: appointments = [],
        isLoading: loading,
        isFetching,
        refetch,
    } = useQuery<Appointment[]>({
        queryKey: ['appointments-mine'],
        queryFn: () => appointmentService.listMine(),
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (isFetching && !loading) {
            syncLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(syncAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(syncAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
                ])
            );
            syncLoop.current.start();
        } else {
            syncLoop.current?.stop();
            Animated.timing(syncAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }
    }, [isFetching, loading, syncAnim]);

    useEffect(() => {
        const prev = prevStatusRef.current;
        const changed = new Set<string>();
        appointments.forEach((a: Appointment) => {
            if (prev[a.id] && prev[a.id] !== a.appointment_status) {
                changed.add(a.id);
            }
            prev[a.id] = a.appointment_status;
        });
        if (changed.size > 0) {
            setChangedIds(changed);
            setTimeout(() => setChangedIds(new Set()), 3000);
        }
    }, [appointments]);

    const filtered =
        activeFilter === 'ALL'
            ? appointments
            : appointments.filter((a: Appointment) => a.appointment_status === activeFilter);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meus Agendamentos</Text>
                <Animated.View style={[styles.syncDot, { opacity: syncAnim }]}>
                    <View style={styles.syncDotInner} />
                </Animated.View>
                {isFetching && !loading && <Text style={styles.syncLabel}>atualizando...</Text>}
            </View>

            <View style={styles.filtersWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                    {FILTERS.map((f) => (
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
                        <Ionicons name="calendar-outline" size={48} color={C.border} />
                        <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
                    </View>
                ) : (
                    filtered.map((item) => {
                        const justChanged = changedIds.has(item.id);
                        return (
                            <View key={item.id} style={[styles.card, justChanged && styles.cardChanged]}>
                                {justChanged && (
                                    <View style={styles.changedBanner}>
                                        <Ionicons name="checkmark-circle" size={14} color={C.info} />
                                        <Text style={styles.changedText}>Status atualizado!</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.cardRow}
                                    activeOpacity={0.7}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/appointment-details',
                                            params: { appointmentId: item.id },
                                        })
                                    }
                                >
                                    <View style={styles.cardLeft}>
                                        <View style={styles.dateBox}>
                                            <Text style={styles.dateDay}>{item.date?.split('-')[2]}</Text>
                                            <Text style={styles.dateMonth}>
                                                {
                                                    [
                                                        'Jan',
                                                        'Fev',
                                                        'Mar',
                                                        'Abr',
                                                        'Mai',
                                                        'Jun',
                                                        'Jul',
                                                        'Ago',
                                                        'Set',
                                                        'Out',
                                                        'Nov',
                                                        'Dez',
                                                    ][parseInt(item.date?.split('-')[1]) - 1]
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.shopName}>{item.barber?.shop_name}</Text>
                                        <Text style={styles.serviceName}>
                                            {(item.services ?? []).map((s) => s.name).join(' + ')}
                                        </Text>
                                        <View style={styles.metaRow}>
                                            <Ionicons name="time-outline" size={13} color={C.textMuted} />
                                            <Text style={styles.metaText}>{item.time}</Text>
                                            <Text style={styles.metaSep}>·</Text>
                                            <Text style={styles.metaText}>
                                                R${' '}
                                                {(item.services ?? [])
                                                    .reduce((s, svc) => s + Number(svc.price ?? 0), 0)
                                                    .toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                    <PulsingBadge status={item.appointment_status} />
                                </TouchableOpacity>
                                {item.appointment_status === 'COMPLETED' && !item.reviewed && (
                                    <TouchableOpacity style={styles.reviewBtn} onPress={() => setReviewing(item)}>
                                        <Ionicons name="star-outline" size={14} color={C.primary} />
                                        <Text style={styles.reviewBtnText}>Avaliar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
            <ReviewModal
                visible={reviewing !== null}
                appointmentId={reviewing?.id ?? null}
                shopName={reviewing?.barber?.shop_name ?? ''}
                onClose={() => setReviewing(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bgPage },
    header: {
        backgroundColor: C.bgSurface,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: C.textPrimary, flex: 1 },
    syncDot: { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    syncDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.info },
    syncLabel: { fontSize: 11, color: C.info },

    filtersWrapper: { backgroundColor: C.bgSurface, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    filtersRow: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: C.bgPage,
        borderWidth: 1,
        borderColor: C.borderLight,
        marginRight: 8,
    },
    filterChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    filterText: { fontSize: 13, color: C.textSecondary },
    filterTextActive: { color: C.bgSurface, fontWeight: '600' },

    listScroll: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 32 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: C.textFaint, fontSize: 14, marginTop: 10 },

    card: {
        flexDirection: 'column',
        backgroundColor: C.bgSurface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        gap: 12,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardChanged: { borderWidth: 2, borderColor: C.info },
    changedBanner: {
        position: 'absolute',
        top: -1,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.infoBg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    changedText: { fontSize: 11, color: C.info, fontWeight: '600' },

    cardLeft: {},
    dateBox: {
        width: 48,
        height: 52,
        backgroundColor: C.bgPage,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateDay: { fontSize: 20, fontWeight: 'bold', color: C.textPrimary },
    dateMonth: { fontSize: 11, color: C.textMuted, marginTop: 1 },
    cardBody: { flex: 1 },
    shopName: { fontSize: 15, fontWeight: 'bold', color: C.textPrimary },
    serviceName: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    metaText: { fontSize: 12, color: C.textMuted },
    metaSep: { fontSize: 12, color: C.borderInput },

    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 5,
    },
    badgeDot: { width: 7, height: 7, borderRadius: 4 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    reviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: C.primaryBg,
        paddingVertical: 10,
        borderRadius: 8,
    },
    reviewBtnText: { fontSize: 13, color: C.primaryDark, fontWeight: '700' },
});
