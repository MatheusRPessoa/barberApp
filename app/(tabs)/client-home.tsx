import { C } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { barberService, BarberShop } from '@/services/barberService';
import { couponService } from '@/services/couponService';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useNotificationsContext } from '@/context/NotificationsContext';

import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlaceHolderImage from '@/components/PlaceholderImage';
import { useRouter } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';

function formatAddress(shop: BarberShop) {
    return `${shop.street}, ${shop.number} - ${shop.city}/${shop.state}`;
}

// ── Abas com dados mockados (aguardando backend de geolocalização, favoritos e trending) ──
const TABS = ['Próximos', 'Em Alta', 'Favoritos'];

const NEARBY = [
    {
        id: '0',
        name: 'Teste Barb',
        rating: 5.0,
        distance: '0.2km',
        time: '3min',
        discount: '30% OFF',
        services: ['Corte', 'Barba', 'Penteado'],
    },
    {
        id: '1',
        name: 'Classic Cuts',
        rating: 4.8,
        distance: '0.8km',
        time: '10min',
        discount: '20% OFF',
        services: ['Barba'],
    },
    {
        id: '2',
        name: 'Modern Barber',
        rating: 4.6,
        distance: '1.2km',
        time: '15min',
        discount: '15% OFF',
        services: ['Coloração'],
    },
    {
        id: '3',
        name: "Gentleman's Corner",
        rating: 4.9,
        distance: '1.5km',
        time: '15min',
        discount: null,
        services: ['Corte', 'Penteado'],
    },
    {
        id: '4',
        name: 'Sharp & Clean',
        rating: 4.7,
        distance: '2.0km',
        time: '20min',
        discount: null,
        services: ['Corte'],
    },
];

const TRENDING = [
    {
        id: '0',
        name: 'Teste Barb',
        rating: 5.0,
        distance: '0.2km',
        time: '3min',
        discount: '30% OFF',
        services: ['Corte', 'Barba', 'Penteado'],
    },
    {
        id: '5',
        name: 'The Barber Lab',
        rating: 4.9,
        distance: '0.5km',
        time: '8min',
        discount: '10% OFF',
        services: ['Corte', 'Barba'],
    },
    {
        id: '6',
        name: 'Studio 54 Barber',
        rating: 4.8,
        distance: '1.8km',
        time: '18min',
        discount: null,
        services: ['Penteado', 'Coloração'],
    },
];

const FAVORITES = [
    {
        id: '0',
        name: 'Teste Barb',
        rating: 5.0,
        distance: '0.2km',
        time: '3min',
        discount: '30% OFF',
        services: ['Corte', 'Barba', 'Penteado'],
    },
    {
        id: '1',
        name: 'Classic Cuts',
        rating: 4.8,
        distance: '0.8km',
        time: '10min',
        discount: '20% OFF',
        services: ['Corte', 'Barba'],
    },
];

function Rating({ rating }: { rating: number | null }) {
    if (rating === null) {
        return (
            <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Novo</Text>
            </View>
        );
    }
    return (
        <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={C.primary} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
    );
}

function RealShopCard({ shop, featured, onAgendar }: { shop: BarberShop; featured: boolean; onAgendar: () => void }) {
    return (
        <View style={[styles.listCard, featured && styles.listCardFeatured]}>
            <PlaceHolderImage style={[styles.listImage, featured && styles.listImageFeatured]} logoSize={28} />
            <View style={styles.listInfo}>
                <View style={styles.listNameRow}>
                    <Text style={styles.listName}>{shop.shop_name}</Text>
                    {featured && (
                        <View style={styles.topBadge}>
                            <Text style={styles.topBadgeText}>#1</Text>
                        </View>
                    )}
                    {shop.is_favorite !== undefined && (
                        // Ação de favoritar aguarda backend — por ora só exibe o estado
                        <TouchableOpacity disabled style={{ marginLeft: 'auto' }}>
                            <Ionicons
                                name={shop.is_favorite ? 'heart' : 'heart-outline'}
                                size={18}
                                color={shop.is_favorite ? C.danger : C.textMuted}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                <Rating rating={shop.rating} />
                <View style={styles.listMeta}>
                    <Ionicons name="location-outline" size={12} color={C.primary} />
                    <Text style={styles.listMetaText} numberOfLines={1}>
                        {formatAddress(shop)}
                        {shop.distance_km != null ? ` · ${shop.distance_km.toFixed(1)} km` : ''}
                    </Text>
                </View>
                <View style={styles.serviceTagsRow}>
                    {(shop.services ?? []).map((s) => (
                        <View key={s.id} style={styles.serviceTag}>
                            <Text style={styles.serviceTagText}>{s.name}</Text>
                        </View>
                    ))}
                </View>
                <TouchableOpacity style={[styles.bookBtn, featured && styles.bookBtnFeatured]} onPress={onAgendar}>
                    <Text style={styles.bookBtnText}>Agendar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ClientHome() {
    const { user } = useAuth();
    const router = useRouter();
    const { unreadCount } = useNotificationsContext();
    const { coords, placeLabel } = useLocation();
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [search, setSearch] = useState('');

    const { data: barbers = [], isLoading: loadingBarbers } = useQuery({
        queryKey: ['barbers', coords],
        queryFn: () => barberService.listBarbers(coords ?? undefined),
        staleTime: 5 * 60_000,
    });

    const { data: coupons = [] } = useQuery({
        queryKey: ['coupons'],
        queryFn: () => couponService.list(),
        staleTime: 5 * 60_000,
    });

    const serviceFilters = [...new Set(barbers.flatMap((b) => (b.services ?? []).map((s) => s.name)))];

    const filtered = barbers
        .filter((b) => !activeFilter || (b.services ?? []).some((s) => s.name === activeFilter))
        .filter((b) => search.trim() === '' || b.shop_name.toLowerCase().includes(search.trim().toLowerCase()));

    const topShops = filtered.slice(0, 4);

    // "Próximos" usa distância real quando há localização; Em Alta/Favoritos seguem mockados
    const nearbyReal = coords
        ? [...filtered].sort((a, b) => (a.distance_km ?? Number.MAX_VALUE) - (b.distance_km ?? Number.MAX_VALUE))
        : null;

    const mockList = [NEARBY, TRENDING, FAVORITES][activeTab].filter(
        (item) => !activeFilter || item.services.includes(activeFilter)
    );

    function handleAgendar(shop: BarberShop) {
        router.push({
            pathname: '/booking',
            params: { barberId: shop.id, barberName: shop.shop_name },
        });
    }

    // Placeholder: cards mockados agendam na primeira barbearia real até a integração
    function handleAgendarMock() {
        if (barbers[0]) handleAgendar(barbers[0]);
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <PlaceHolderImage style={styles.avatarCircle} logoSize={18} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} </Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={13} color={C.textMuted} />
                            <Text style={styles.location}>{placeLabel ?? 'Localização atual'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications')}>
                        <Ionicons name="notifications-outline" size={22} color={C.textPrimary} />
                        {unreadCount > 0 && (
                            <View style={styles.bellBadge}>
                                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color={C.textFaint} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar barbearias..."
                        placeholderTextColor={C.textFaint}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                    <TouchableOpacity
                        style={[styles.filterChip, activeFilter === null && styles.filterChipActive]}
                        onPress={() => setActiveFilter(null)}
                    >
                        <Text style={[styles.filterText, activeFilter === null && styles.filterTextActive]}>Todos</Text>
                    </TouchableOpacity>
                    {serviceFilters.map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Melhores Barbearias</Text>
                    <TouchableOpacity onPress={() => router.push('/all-shops')}>
                        <Text style={styles.seeAll}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                {loadingBarbers ? (
                    <Text style={styles.emptyText}>Carregando...</Text>
                ) : filtered.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="storefront-outline" size={48} color={C.border} />
                        <Text style={styles.emptyText}>Nenhuma barbearia encontrada.</Text>
                    </View>
                ) : (
                    <>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.topShopsRow}
                        >
                            {topShops.map((shop, index) => (
                                <View key={shop.id} style={[styles.shopCard, index === 0 && styles.shopCardFeatured]}>
                                    <PlaceHolderImage
                                        style={[styles.shopImage, index === 0 && styles.shopImageFeatured]}
                                        logoSize={32}
                                    >
                                        {index === 0 && (
                                            <View style={styles.featuredBadge}>
                                                <Text style={styles.featuredBadgeText}>⭐ Destaque</Text>
                                            </View>
                                        )}
                                    </PlaceHolderImage>
                                    <Text style={[styles.shopName, index === 0 && styles.shopNameFeatured]}>
                                        {shop.shop_name}
                                    </Text>
                                    <Rating rating={shop.rating} />
                                    <Text style={styles.shopTag} numberOfLines={1}>
                                        {formatAddress(shop)}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.bookBtn, index === 0 && styles.bookBtnFeatured]}
                                        onPress={() => handleAgendar(shop)}
                                    >
                                        <Text style={styles.bookBtnText}>Agendar</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {coupons.length > 0 && (
                            <View style={styles.offersSection}>
                                <Text style={styles.offersSectionTitle}>Ofertas Especiais</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.offersRow}
                                >
                                    {coupons.map((offer) => (
                                        <View key={offer.id} style={styles.offerCard}>
                                            <PlaceHolderImage style={styles.offerImage} logoSize={36} />
                                            <Text style={styles.offerShop}>{offer.barber.shop_name}</Text>
                                            <Text style={styles.offerDiscount}>{offer.discount_percent}% OFF</Text>
                                            <Text style={styles.offerDays}>{offer.days_left}d restantes</Text>
                                            <Text style={styles.offerCode}>Use o código: {offer.code}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.tabsRow}>
                            {TABS.map((tab, i) => (
                                <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(i)}>
                                    <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
                                    {activeTab === i && <View style={styles.tabUnderline} />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.listContainer}>
                            {activeTab === 0 && nearbyReal
                                ? nearbyReal.map((shop, index) => (
                                      <RealShopCard
                                          key={shop.id}
                                          shop={shop}
                                          featured={index === 0}
                                          onAgendar={() => handleAgendar(shop)}
                                      />
                                  ))
                                : mockList.map((item) => (
                                      <View
                                          key={item.id}
                                          style={[styles.listCard, item.id === '0' && styles.listCardFeatured]}
                                      >
                                          <PlaceHolderImage
                                              style={[styles.listImage, item.id === '0' && styles.listImageFeatured]}
                                              logoSize={28}
                                          />
                                          <View style={styles.listInfo}>
                                              <View style={styles.listNameRow}>
                                                  <Text style={styles.listName}>{item.name}</Text>
                                                  {item.id === '0' && (
                                                      <View style={styles.topBadge}>
                                                          <Text style={styles.topBadgeText}>#1</Text>
                                                      </View>
                                                  )}
                                              </View>
                                              <View style={styles.ratingRow}>
                                                  <Ionicons name="star" size={12} color={C.primary} />
                                                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                              </View>
                                              <View style={styles.listMeta}>
                                                  <Ionicons name="location-outline" size={12} color={C.textMuted} />
                                                  <Text style={styles.listMetaText}>{item.distance}</Text>
                                                  <Ionicons
                                                      name="time-outline"
                                                      size={12}
                                                      color={C.textMuted}
                                                      style={{ marginLeft: 8 }}
                                                  />
                                                  <Text style={styles.listMetaText}>{item.time}</Text>
                                              </View>
                                              <View style={styles.serviceTagsRow}>
                                                  {item.services.map((s) => (
                                                      <View key={s} style={styles.serviceTag}>
                                                          <Text style={styles.serviceTagText}>{s}</Text>
                                                      </View>
                                                  ))}
                                              </View>
                                              {item.discount && (
                                                  <View style={styles.discountBadge}>
                                                      <Text style={styles.discountText}>{item.discount}</Text>
                                                  </View>
                                              )}
                                              <TouchableOpacity
                                                  style={[styles.bookBtn, item.id === '0' && styles.bookBtnFeatured]}
                                                  onPress={handleAgendarMock}
                                              >
                                                  <Text style={styles.bookBtnText}>Agendar</Text>
                                              </TouchableOpacity>
                                          </View>
                                      </View>
                                  ))}
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Todas as Barbearias</Text>
                        </View>

                        <View style={styles.listContainer}>
                            {filtered.map((shop, index) => (
                                <RealShopCard
                                    key={shop.id}
                                    shop={shop}
                                    featured={index === 0}
                                    onAgendar={() => handleAgendar(shop)}
                                />
                            ))}
                        </View>
                    </>
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
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 12,
    },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.borderInput },
    greeting: { fontSize: 16, fontWeight: 'bold', color: C.textPrimary },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    location: { fontSize: 12, color: C.textMuted },
    bellBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.bgSurface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: C.danger,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    bellBadgeText: { fontSize: 9, fontWeight: '800', color: C.bgSurface },

    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bgSurface,
        marginHorizontal: 16,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        marginBottom: 14,
    },
    searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },

    filtersRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: C.bgSurface,
        borderWidth: 1,
        borderColor: C.borderLight,
    },
    filterChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    filterText: { fontSize: 13, color: C.textSecondary },
    filterTextActive: { color: C.bgSurface, fontWeight: '600' },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: C.textPrimary },
    seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },

    topShopsRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 20 },
    shopCard: { width: 160, backgroundColor: C.bgSurface, borderRadius: 12, overflow: 'hidden', padding: 10 },
    shopCardFeatured: { width: 175, borderWidth: 2, borderColor: C.primary },
    shopImage: {
        width: '100%',
        height: 100,
        backgroundColor: C.bgDisabled,
        borderRadius: 8,
        marginBottom: 8,
        justifyContent: 'flex-end',
    },
    shopImageFeatured: { backgroundColor: C.primaryMuted },
    featuredBadge: {
        backgroundColor: C.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        alignSelf: 'flex-start',
        margin: 6,
    },
    featuredBadgeText: { fontSize: 10, fontWeight: '800', color: C.textPrimary },
    shopName: { fontSize: 14, fontWeight: 'bold', color: C.textPrimary },
    shopNameFeatured: { color: C.primaryDark },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    ratingText: { fontSize: 12, color: C.textSecondary },
    shopTag: { fontSize: 11, color: C.textMuted, marginTop: 2 },

    offersSection: { backgroundColor: C.navySection, paddingVertical: 16, marginBottom: 16 },
    offersSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: C.bgSurface,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    offersRow: { paddingHorizontal: 16, gap: 12 },
    offerCard: { width: 220, backgroundColor: C.navyCard, borderRadius: 12, overflow: 'hidden', padding: 12 },
    offerImage: { width: '100%', height: 100, backgroundColor: C.navyImage, borderRadius: 8, marginBottom: 10 },
    offerShop: { fontSize: 11, color: C.primary, fontWeight: '600', marginBottom: 4 },
    offerDiscount: { fontSize: 20, fontWeight: 'bold', color: C.bgSurface },
    offerDays: { fontSize: 11, color: C.textFaint, marginTop: 2 },
    offerCode: { fontSize: 11, color: C.borderInput, marginTop: 4 },

    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.borderLight,
    },
    tab: { flex: 1, alignItems: 'center', paddingBottom: 10 },
    tabText: { fontSize: 14, color: C.textMuted },
    tabTextActive: { color: C.textPrimary, fontWeight: '700' },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        width: '60%',
        height: 2,
        backgroundColor: C.primary,
        borderRadius: 2,
    },

    listContainer: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
    listCard: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 12, overflow: 'hidden' },
    listCardFeatured: { borderWidth: 2, borderColor: C.primary },
    listImage: { width: 110, backgroundColor: C.bgDisabled },
    listImageFeatured: { backgroundColor: C.primaryMuted },
    listInfo: { flex: 1, padding: 12 },
    listNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    listName: { fontSize: 15, fontWeight: 'bold', color: C.textPrimary },
    topBadge: { backgroundColor: C.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
    topBadgeText: { fontSize: 10, fontWeight: '900', color: C.textPrimary },
    listMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
    listMetaText: { fontSize: 11, color: C.textMuted },
    serviceTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
    serviceTag: { backgroundColor: C.bgDivider, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
    serviceTagText: { fontSize: 10, color: C.textLabel },
    discountBadge: {
        alignSelf: 'flex-start',
        backgroundColor: C.warningBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    discountText: { fontSize: 11, color: C.warningText, fontWeight: '700' },
    bookBtn: {
        marginTop: 8,
        backgroundColor: C.textPrimary,
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    bookBtnFeatured: { backgroundColor: C.primary },
    bookBtnText: { color: C.bgSurface, fontWeight: '700', fontSize: 13 },

    newBadge: {
        alignSelf: 'flex-start',
        backgroundColor: C.infoBg,
        borderRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginTop: 3,
    },
    newBadgeText: { fontSize: 11, fontWeight: '700', color: C.info },
    emptyContainer: { alignItems: 'center', marginTop: 40, gap: 10 },
    emptyText: { color: C.textFaint, fontSize: 14, textAlign: 'center', marginTop: 10 },
});
