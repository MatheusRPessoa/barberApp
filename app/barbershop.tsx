import { C } from '@/constants/Colors';
import PlaceHolderImage from '@/components/PlaceholderImage';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { barberService } from '@/services/barberService';
import { reviewService } from '@/services/reviewService';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDate(iso: string) {
    return iso?.split('T')[0]?.split('-').reverse().join('/') ?? '';
}

export default function BarberShopProfile() {
    const router = useRouter();
    const { user } = useAuth();
    const isBarber = user?.type === 'BARBER';
    const { barberId: paramId } = useLocalSearchParams<{ barberId?: string }>();

    // Barbeiro abrindo o próprio perfil (sem id na rota) → resolve o próprio id
    const { data: ownProfile } = useQuery({
        queryKey: ['barber-self'],
        queryFn: () => authService.getBarberProfile(),
        enabled: isBarber && !paramId,
        staleTime: 5 * 60_000,
    });
    const barberId = paramId ?? ownProfile?.id;

    const { data: barbers = [] } = useQuery({
        queryKey: ['barbers'],
        queryFn: () => barberService.listBarbers(),
        staleTime: 5 * 60_000,
    });
    const shop = barbers.find((b) => b.id === barberId);

    const { data: reviews = [] } = useQuery({
        queryKey: ['barber-reviews', barberId],
        queryFn: () => reviewService.listByBarber(barberId!),
        enabled: !!barberId,
        staleTime: 60_000,
    });

    const completedCount = (shop as { completed_count?: number } | undefined)?.completed_count;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil da barbearia</Text>
            </View>

            {!shop ? (
                <View style={styles.center}>
                    <Ionicons name="storefront-outline" size={48} color={C.border} />
                    <Text style={styles.emptyText}>Barbearia não encontrada.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Cabeçalho */}
                    <View style={styles.shopHeader}>
                        <PlaceHolderImage style={styles.logo} logoSize={36} />
                        <Text style={styles.shopName}>{shop.shop_name}</Text>
                        <View style={styles.subRow}>
                            {shop.rating != null ? (
                                <>
                                    <Ionicons name="star" size={14} color={C.primary} />
                                    <Text style={styles.subText}>{shop.rating.toFixed(1)}</Text>
                                    <Text style={styles.dot}>·</Text>
                                </>
                            ) : (
                                <>
                                    <View style={styles.newBadge}>
                                        <Text style={styles.newBadgeText}>Novo</Text>
                                    </View>
                                    <Text style={styles.dot}>·</Text>
                                </>
                            )}
                            <Ionicons name="location-outline" size={13} color={C.textMuted} />
                            <Text style={styles.subText} numberOfLines={1}>
                                {shop.city}/{shop.state}
                            </Text>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statNum}>{completedCount ?? '—'}</Text>
                            <Text style={styles.statLabel}>Cortes</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statNum}>{reviews.length}</Text>
                            <Text style={styles.statLabel}>Avaliações</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statNum}>{shop.rating != null ? shop.rating.toFixed(1) : '—'}</Text>
                            <Text style={styles.statLabel}>Nota</Text>
                        </View>
                    </View>

                    {/* Ações */}
                    {isBarber ? (
                        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
                            <Ionicons name="create-outline" size={18} color={C.textPrimary} />
                            <Text style={styles.btnSecondaryText}>Editar informações</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ gap: 10 }}>
                            <TouchableOpacity style={[styles.btnSecondary, styles.btnDisabled]} disabled>
                                <Ionicons name="person-add-outline" size={18} color={C.textMuted} />
                                <Text style={[styles.btnSecondaryText, { color: C.textMuted }]}>Seguir (em breve)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.btnPrimary}
                                onPress={() =>
                                    router.push({
                                        pathname: '/booking',
                                        params: { barberId: shop.id, barberName: shop.shop_name },
                                    })
                                }
                            >
                                <Ionicons name="calendar-outline" size={18} color={C.bgSurface} />
                                <Text style={styles.btnPrimaryText}>Agendar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Serviços */}
                    <Text style={styles.sectionTitle}>Serviços</Text>
                    <View style={styles.card}>
                        {(shop.services ?? []).length === 0 ? (
                            <Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>
                        ) : (
                            (shop.services ?? []).map((s) => (
                                <View key={s.id} style={styles.serviceRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.serviceName}>{s.name}</Text>
                                        <Text style={styles.serviceDur}>{s.duration_minutes} min</Text>
                                    </View>
                                    <Text style={styles.servicePrice}>R$ {Number(s.price ?? 0).toFixed(2)}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Avaliações */}
                    <Text style={styles.sectionTitle}>Avaliações ({reviews.length})</Text>
                    {reviews.length === 0 ? (
                        <Text style={styles.emptyText}>Ainda não há avaliações.</Text>
                    ) : (
                        reviews.map((r) => (
                            <View key={r.id} style={styles.reviewCard}>
                                <View style={styles.reviewStars}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Ionicons
                                            key={n}
                                            name={n <= r.rating ? 'star' : 'star-outline'}
                                            size={13}
                                            color={C.primary}
                                        />
                                    ))}
                                </View>
                                {r.comment ? <Text style={styles.reviewComment}>“{r.comment}”</Text> : null}
                                <Text style={styles.reviewMeta}>
                                    {r.client.name} · {formatDate(r.created_at)}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bgPage },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.bgSurface, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgPage, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: C.textPrimary },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    scroll: { padding: 16, paddingBottom: 32 },

    shopHeader: { alignItems: 'center', marginBottom: 16 },
    logo: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.borderInput, marginBottom: 12 },
    shopName: { fontSize: 20, fontWeight: 'bold', color: C.textPrimary },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    subText: { fontSize: 13, color: C.textMuted },
    dot: { color: C.borderInput, marginHorizontal: 2 },
    newBadge: { backgroundColor: C.infoBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
    newBadgeText: { fontSize: 11, fontWeight: '700', color: C.info },

    statsRow: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 12, paddingVertical: 16, marginBottom: 16 },
    stat: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: 'bold', color: C.textPrimary },
    statLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: C.borderLight },

    btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 14 },
    btnPrimaryText: { color: C.bgSurface, fontWeight: '700', fontSize: 15 },
    btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.bgSurface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 14 },
    btnSecondaryText: { color: C.textPrimary, fontWeight: '600', fontSize: 15 },
    btnDisabled: { opacity: 0.6 },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginTop: 24, marginBottom: 12 },
    card: { backgroundColor: C.bgSurface, borderRadius: 12, padding: 4 },
    serviceRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    serviceName: { fontSize: 15, color: C.textPrimary },
    serviceDur: { fontSize: 12, color: C.textMuted, marginTop: 1 },
    servicePrice: { fontSize: 14, fontWeight: '600', color: C.textPrimary },

    reviewCard: { backgroundColor: C.bgSurface, borderRadius: 12, padding: 14, marginBottom: 10 },
    reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 4 },
    reviewComment: { fontSize: 14, color: C.textPrimary, marginBottom: 4 },
    reviewMeta: { fontSize: 12, color: C.textMuted },

    emptyText: { fontSize: 14, color: C.textFaint, textAlign: 'center', padding: 12 },
});
