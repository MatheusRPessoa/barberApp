import { C } from '@/constants/Colors';
import { Coupon, couponService } from '@/services/couponService';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDate(dateStr: string) {
    return dateStr?.split('-').reverse().join('/') ?? '';
}

export default function Coupons() {
    const {
        data: coupons = [],
        isLoading,
        isFetching,
        refetch,
    } = useQuery<Coupon[]>({
        queryKey: ['coupons'],
        queryFn: () => couponService.list(),
        staleTime: 5 * 60_000,
    });

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cupons</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />}
            >
                {isLoading ? (
                    <Text style={styles.emptyText}>Carregando...</Text>
                ) : coupons.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="pricetag-outline" size={48} color={C.border} />
                        <Text style={styles.emptyText}>Nenhum cupom disponível no momento.</Text>
                    </View>
                ) : (
                    coupons.map((coupon) => (
                        <View key={coupon.id} style={styles.card}>
                            <View style={styles.discountBox}>
                                <Text style={styles.discountValue}>{coupon.discount_percent}%</Text>
                                <Text style={styles.discountOff}>OFF</Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.shopName}>{coupon.barber.shop_name}</Text>
                                <Text style={styles.code}>Código: {coupon.code}</Text>
                                <View style={styles.metaRow}>
                                    <Ionicons name="time-outline" size={13} color={C.textMuted} />
                                    <Text style={styles.metaText}>
                                        Válido até {formatDate(coupon.valid_until)} ({coupon.days_left}d restantes)
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
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
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: C.textPrimary },

    scroll: { padding: 16, gap: 12, flexGrow: 1 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 },
    emptyText: { color: C.textFaint, fontSize: 14, textAlign: 'center' },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bgSurface,
        borderRadius: 12,
        padding: 14,
        gap: 14,
    },
    discountBox: {
        width: 64,
        height: 64,
        borderRadius: 10,
        backgroundColor: C.primaryBg,
        borderWidth: 1,
        borderColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    discountValue: { fontSize: 18, fontWeight: '900', color: C.primaryDark },
    discountOff: { fontSize: 10, fontWeight: '700', color: C.primaryDark },
    info: { flex: 1 },
    shopName: { fontSize: 15, fontWeight: 'bold', color: C.textPrimary },
    code: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    metaText: { fontSize: 12, color: C.textMuted },
});
