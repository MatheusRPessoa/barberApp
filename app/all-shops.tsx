import { C } from '@/constants/Colors';
import PlaceholderImage from '@/components/PlaceholderImage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { barberService } from '@/services/barberService';
import { useQuery } from '@tanstack/react-query';

export default function AllShops() {
    const router = useRouter();
    const { data: barbers = [], isLoading: loadingBarbers } = useQuery({
        queryKey: ['barbers'],
        queryFn: () => barberService.listBarbers(),
        staleTime: 5 * 60_000,
    });

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Melhores Barbearias</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                {loadingBarbers ? (
                    <Text style={styles.emptyText}>Carregando...</Text>
                ) : barbers.length === 0 ? (
                    <Text style={styles.emptyText}>Nenhuma barbearia cadastrada.</Text>
                ) : (
                    barbers.map((shop, index) => (
                        <View key={shop.id} style={[styles.card, index === 0 && styles.cardFeatured]}>
                            <PlaceholderImage
                                style={[styles.image, index === 0 && styles.imageFeatured]}
                                logoSize={32}
                            />
                            <View style={styles.info}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.name}>{shop.shop_name}</Text>
                                    {index === 0 && (
                                        <View style={styles.featuredBadge}>
                                            <Text style={styles.featuredBadgeText}>Destaque</Text>
                                        </View>
                                    )}
                                </View>
                                {shop.rating === null ? (
                                    <View style={styles.newBadge}>
                                        <Text style={styles.newBadgeText}>Novo</Text>
                                    </View>
                                ) : (
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={13} color={C.primary} />
                                        <Text style={styles.rating}>{shop.rating.toFixed(1)}</Text>
                                    </View>
                                )}
                                <Text style={styles.tag} numberOfLines={1}>
                                    {shop.street}, {shop.number} — {shop.city}/{shop.state}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.btn, index === 0 && styles.btnFeatured]}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/booking',
                                            params: { barberId: shop.id, barberName: shop.shop_name },
                                        })
                                    }
                                >
                                    <Text style={styles.btnText}>Agendar</Text>
                                </TouchableOpacity>
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
    list: { padding: 16, gap: 12 },
    card: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 12, overflow: 'hidden' },
    cardFeatured: { borderWidth: 2, borderColor: C.primary },
    image: { width: 110, backgroundColor: C.bgDisabled },
    imageFeatured: { backgroundColor: C.primaryMuted },
    info: { flex: 1, padding: 12 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    name: { fontSize: 15, fontWeight: 'bold', color: C.textPrimary },
    featuredBadge: { backgroundColor: C.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
    featuredBadgeText: { fontSize: 10, fontWeight: '800', color: C.textPrimary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    rating: { fontSize: 12, color: C.textSecondary },
    tag: { fontSize: 12, color: C.textMuted, marginTop: 4, marginBottom: 8 },
    btn: { backgroundColor: C.textPrimary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    btnFeatured: { backgroundColor: C.primary },
    btnText: { color: C.bgSurface, fontWeight: '700', fontSize: 13 },

    newBadge:      { alignSelf: 'flex-start', backgroundColor: C.infoBg, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
    newBadgeText:  { fontSize: 11, fontWeight: '700', color: C.info },
    emptyContainer:{ alignItems: 'center', marginTop: 40, gap: 10 },
    emptyText: { color: C.textFaint, fontSize: 14, textAlign: 'center', marginTop: 10 },
});
