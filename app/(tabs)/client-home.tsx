import { useAuth } from '@/context/AuthContext';
import { barberService, Service } from '@/services/barberService';
import { appointmentService } from '@/services/appointmentService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function toLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function generateDates(count: number) {
    return Array.from({ length: count }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return toLocalDate(d);
    });
}

function formatDateChip(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const isToday  = dateStr === toLocalDate(new Date());
    return { label: isToday ? 'Hoje' : weekdays[d.getDay()], day: String(day).padStart(2,'0'), month: months[month - 1] };
}

const FILTERS = ['Corte', 'Barba', 'Penteado', 'Barbear', 'Coloração'];

const TOP_SHOPS = [
    { id: '0', name: 'Teste Barb',        rating: 5.0, tag: 'Top Barbearia · São Paulo', featured: true },
    { id: '1', name: 'Royal Shave',        rating: 4.9, tag: 'Premium Grooming',          featured: false },
    { id: '2', name: 'Elite Cuts',         rating: 4.8, tag: 'Luxury Experience',          featured: false },
    { id: '3', name: 'Urban Barber',       rating: 4.7, tag: 'Cortes Modernos',            featured: false },
];

const OFFERS = [
    { id: '1', discount: '30% OFF', code: 'NEWUSER',    daysLeft: 2,  shop: 'Teste Barb' },
    { id: '2', discount: '25% OFF', code: 'WEEKEND',    daysLeft: 5,  shop: 'Royal Shave' },
    { id: '3', discount: '15% OFF', code: 'FIDELIDADE', daysLeft: 10, shop: 'Elite Cuts' },
];

const NEARBY = [
    { id: '0', name: 'Teste Barb',         rating: 5.0, distance: '0.2km', time: '3min',  discount: '30% OFF', services: ['Corte', 'Barba', 'Penteado'] },
    { id: '1', name: 'Classic Cuts',        rating: 4.8, distance: '0.8km', time: '10min', discount: '20% OFF', services: ['Corte', 'Barba'] },
    { id: '2', name: 'Modern Barber',       rating: 4.6, distance: '1.2km', time: '15min', discount: '15% OFF', services: ['Corte', 'Coloração'] },
    { id: '3', name: "Gentleman's Corner",  rating: 4.9, distance: '1.5km', time: '15min', discount: null,       services: ['Barba', 'Penteado'] },
    { id: '4', name: 'Sharp & Clean',       rating: 4.7, distance: '2.0km', time: '20min', discount: null,       services: ['Corte'] },
];

const TRENDING = [
    { id: '0', name: 'Teste Barb',        rating: 5.0, distance: '0.2km', time: '3min',  discount: '30% OFF', services: ['Corte', 'Barba', 'Penteado'] },
    { id: '5', name: 'The Barber Lab',    rating: 4.9, distance: '0.5km', time: '8min',  discount: '10% OFF', services: ['Corte', 'Barba'] },
    { id: '6', name: 'Studio 54 Barber',  rating: 4.8, distance: '1.8km', time: '18min', discount: null,       services: ['Penteado', 'Coloração'] },
];

const FAVORITES = [
    { id: '0', name: 'Teste Barb',        rating: 5.0, distance: '0.2km', time: '3min',  discount: '30% OFF', services: ['Corte', 'Barba', 'Penteado'] },
    { id: '1', name: 'Classic Cuts',       rating: 4.8, distance: '0.8km', time: '10min', discount: '20% OFF', services: ['Corte', 'Barba'] },
];

const TABS = ['Próximos', 'Em Alta', 'Favoritos'];

const DATES = generateDates(14);

export default function ClientHome() {
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState('Corte');
    const [activeTab, setActiveTab]       = useState(0);
    const [search, setSearch]             = useState('');

    const queryClient = useQueryClient();

    const [bookingModal, setBookingModal]         = useState(false);
    const [activeBarberId, setActiveBarberId]     = useState('');
    const [activeBarberName, setActiveBarberName] = useState('');
    const [step, setStep]                         = useState<1|2|3>(1);
    const [selectedService, setSelectedService]   = useState<Service | null>(null);
    const [selectedDate, setSelectedDate]         = useState('');
    const [selectedTime, setSelectedTime]         = useState('');
    const [bookingFeedback, setBookingFeedback]   = useState('');
    const [feedbackIsError, setFeedbackIsError]   = useState(false);

    const { data: barbers = [] } = useQuery({
        queryKey: ['barbers'],
        queryFn:  () => barberService.listBarbers(),
        staleTime: 5 * 60_000,
    });
    const featuredBarberId = barbers[0]?.id ?? '';

    const { data: services = [], isLoading: loadingServices } = useQuery({
        queryKey: ['barber-services', activeBarberId],
        queryFn:  () => barberService.listBarberServices(activeBarberId),
        enabled:  bookingModal && !!activeBarberId,
    });

    const { data: slotsData, isLoading: loadingSlots } = useQuery({
        queryKey: ['slots', activeBarberId, selectedDate],
        queryFn:  () => barberService.getAvailableSlots(activeBarberId, selectedDate),
        enabled:  !!selectedDate && !!activeBarberId,
    });

    const slots = (() => {
        const raw = slotsData?.available ?? [];
        if (selectedDate !== toLocalDate(new Date())) return raw;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return raw.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            return h * 60 + m > currentMinutes;
        });
    })();

    const bookingMutation = useMutation({
        mutationFn: () => appointmentService.create({
            BARBER_ID:  activeBarberId,
            SERVICE_ID: selectedService!.id,
            DATE:       selectedDate,
            TIME:       selectedTime,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments-mine'] });
            setFeedbackIsError(false);
            setBookingFeedback('Agendamento realizado! Aguarde a confirmação do barbeiro.');
            setTimeout(() => { setBookingModal(false); setBookingFeedback(''); }, 2500);
        },
        onError: (err: any) => {
            setFeedbackIsError(true);
            setBookingFeedback(err.message || 'Erro ao agendar. Tente novamente.');
        },
    });

    function openBooking(barberId: string, barberName: string) {
        setActiveBarberId(barberId);
        setActiveBarberName(barberName);
        setStep(1);
        setSelectedService(null);
        setSelectedDate('');
        setSelectedTime('');
        setBookingFeedback('');
        setBookingModal(true);
    }

    const confirmBooking = () => {
        if (!selectedService || !selectedDate || !selectedTime) return;
        bookingMutation.mutate();
    };

    function handleAgendar(itemId: string, itemName: string) {
        if (itemId === '0' && featuredBarberId) {
            openBooking(featuredBarberId, itemName);
        }
    }

    const listData = [NEARBY, TRENDING, FAVORITES][activeTab];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <View style={styles.avatarCircle} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} </Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={13} color="#888" />
                            <Text style={styles.location}>Localização atual</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.bellBtn}>
                        <Ionicons name="notifications-outline" size={22} color="#1a1a1a" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color="#aaa" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar barbearias..."
                        placeholderTextColor="#aaa"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                    {FILTERS.map(f => (
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
                    <TouchableOpacity><Text style={styles.seeAll}>Ver todas</Text></TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topShopsRow}>
                    {TOP_SHOPS.map(shop => (
                        <View key={shop.id} style={[styles.shopCard, shop.featured && styles.shopCardFeatured]}>
                            <View style={[styles.shopImage, shop.featured && styles.shopImageFeatured]}>
                                {shop.featured && (
                                    <View style={styles.featuredBadge}>
                                        <Text style={styles.featuredBadgeText}>⭐ Destaque</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.shopName, shop.featured && styles.shopNameFeatured]}>{shop.name}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={13} color="#ffb300" />
                                <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
                            </View>
                            <Text style={styles.shopTag}>{shop.tag}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.offersSection}>
                    <Text style={styles.offersSectionTitle}>Ofertas Especiais</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersRow}>
                        {OFFERS.map(offer => (
                            <View key={offer.id} style={styles.offerCard}>
                                <View style={styles.offerImage} />
                                <Text style={styles.offerShop}>{offer.shop}</Text>
                                <Text style={styles.offerDiscount}>{offer.discount}</Text>
                                <Text style={styles.offerDays}>{offer.daysLeft}d restantes</Text>
                                <Text style={styles.offerCode}>Use o código: {offer.code}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.tabsRow}>
                    {TABS.map((tab, i) => (
                        <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(i)}>
                            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
                            {activeTab === i && <View style={styles.tabUnderline} />}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.listContainer}>
                    {listData.map(item => (
                        <View key={item.id} style={[styles.listCard, item.id === '0' && styles.listCardFeatured]}>
                            <View style={[styles.listImage, item.id === '0' && styles.listImageFeatured]} />
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
                                    <Ionicons name="star" size={12} color="#ffb300" />
                                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                </View>
                                <View style={styles.listMeta}>
                                    <Ionicons name="location-outline" size={12} color="#888" />
                                    <Text style={styles.listMetaText}>{item.distance}</Text>
                                    <Ionicons name="time-outline" size={12} color="#888" style={{ marginLeft: 8 }} />
                                    <Text style={styles.listMetaText}>{item.time}</Text>
                                </View>
                                <View style={styles.serviceTagsRow}>
                                    {item.services.map(s => (
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
                                    onPress={() => handleAgendar(item.id, item.name)}
                                    disabled={item.id === '0' && !featuredBarberId}
                                >
                                    <Text style={styles.bookBtnText}>Agendar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>

            <Modal visible={bookingModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>

                        {/* Header do modal */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Agendar Horário</Text>
                                <Text style={styles.modalSubtitle}>{activeBarberName}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setBookingModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.stepsRow}>
                            {['Serviço', 'Data', 'Confirmar'].map((label, i) => (
                                <View key={label} style={styles.stepItem}>
                                    <View style={[styles.stepDot, step > i + 1 && styles.stepDotDone, step === i + 1 && styles.stepDotActive]}>
                                        <Text style={styles.stepDotText}>{step > i + 1 ? '✓' : i + 1}</Text>
                                    </View>
                                    <Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>{label}</Text>
                                </View>
                            ))}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>

                            {step === 1 && (
                                <View>
                                    <Text style={styles.stepTitle}>Escolha o serviço</Text>
                                    {loadingServices ? (
                                        <ActivityIndicator color="#ffb300" style={{ marginTop: 20 }} />
                                    ) : services.length === 0 ? (
                                        <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 20, fontSize: 13 }}>
                                            Nenhum serviço cadastrado nesta barbearia.
                                        </Text>
                                    ) : (
                                        services.map(s => (
                                            <TouchableOpacity
                                                key={s.id}
                                                style={[styles.serviceItem, selectedService?.id === s.id && styles.serviceItemActive]}
                                                onPress={() => setSelectedService(s)}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.serviceItemName, selectedService?.id === s.id && styles.serviceItemNameActive]}>{s.name}</Text>
                                                    <Text style={styles.serviceItemDuration}>{s.duration_minutes} min</Text>
                                                </View>
                                                <Text style={[styles.serviceItemPrice, selectedService?.id === s.id && styles.serviceItemNameActive]}>
                                                    R$ {Number(s.price ?? 0).toFixed(2)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                    <TouchableOpacity
                                        style={[styles.nextBtn, !selectedService && styles.nextBtnDisabled]}
                                        disabled={!selectedService}
                                        onPress={() => setStep(2)}
                                    >
                                        <Text style={styles.nextBtnText}>Próximo</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {step === 2 && (
                                <View>
                                    <Text style={styles.stepTitle}>Escolha a data</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesRow}>
                                        {DATES.map(d => {
                                            const chip = formatDateChip(d);
                                            return (
                                                <TouchableOpacity
                                                    key={d}
                                                    style={[styles.dateChip, selectedDate === d && styles.dateChipActive]}
                                                    onPress={() => setSelectedDate(d)}
                                                >
                                                    <Text style={[styles.dateChipWeekday, selectedDate === d && styles.dateChipTextActive]}>{chip.label}</Text>
                                                    <Text style={[styles.dateChipDay, selectedDate === d && styles.dateChipTextActive]}>{chip.day}</Text>
                                                    <Text style={[styles.dateChipMonth, selectedDate === d && styles.dateChipTextActive]}>{chip.month}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {selectedDate !== '' && (
                                        <>
                                            <Text style={[styles.stepTitle, { marginTop: 16 }]}>Escolha o horário</Text>
                                            {loadingSlots ? (
                                                <ActivityIndicator color="#ffb300" style={{ marginTop: 12 }} />
                                            ) : slots.length === 0 ? (
                                                <Text style={styles.noSlots}>Nenhum horário disponível nesta data.</Text>
                                            ) : (
                                                <View style={styles.slotsGrid}>
                                                    {slots.map(slot => (
                                                        <TouchableOpacity
                                                            key={slot}
                                                            style={[styles.slotChip, selectedTime === slot && styles.slotChipActive]}
                                                            onPress={() => setSelectedTime(slot)}
                                                        >
                                                            <Text style={[styles.slotText, selectedTime === slot && styles.slotTextActive]}>{slot}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </>
                                    )}

                                    <View style={styles.stepNavRow}>
                                        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                            <Text style={styles.backBtnText}>Voltar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.nextBtn, { flex: 1 }, (!selectedDate || !selectedTime) && styles.nextBtnDisabled]}
                                            disabled={!selectedDate || !selectedTime}
                                            onPress={() => setStep(3)}
                                        >
                                            <Text style={styles.nextBtnText}>Próximo</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {step === 3 && (
                                <View>
                                    <Text style={styles.stepTitle}>Confirme seu agendamento</Text>

                                    <View style={styles.summaryCard}>
                                        <View style={styles.summaryRow}>
                                            <Ionicons name="storefront-outline" size={18} color="#ffb300" />
                                            <Text style={styles.summaryLabel}>Barbearia</Text>
                                            <Text style={styles.summaryValue}>{activeBarberName}</Text>
                                        </View>
                                        <View style={styles.summaryRow}>
                                            <Ionicons name="cut-outline" size={18} color="#ffb300" />
                                            <Text style={styles.summaryLabel}>Serviço</Text>
                                            <Text style={styles.summaryValue}>{selectedService?.name}</Text>
                                        </View>
                                        <View style={styles.summaryRow}>
                                            <Ionicons name="calendar-outline" size={18} color="#ffb300" />
                                            <Text style={styles.summaryLabel}>Data</Text>
                                            <Text style={styles.summaryValue}>{selectedDate?.split('-').reverse().join('/')}</Text>
                                        </View>
                                        <View style={styles.summaryRow}>
                                            <Ionicons name="time-outline" size={18} color="#ffb300" />
                                            <Text style={styles.summaryLabel}>Horário</Text>
                                            <Text style={styles.summaryValue}>{selectedTime}</Text>
                                        </View>
                                        <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                                            <Ionicons name="cash-outline" size={18} color="#ffb300" />
                                            <Text style={styles.summaryLabel}>Valor</Text>
                                            <Text style={[styles.summaryValue, { color: '#28a745', fontWeight: '700' }]}>
                                                R$ {Number(selectedService?.price ?? 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {bookingFeedback !== '' && (
                                        <Text style={[styles.feedbackMsg, feedbackIsError ? styles.feedbackError : styles.feedbackSuccess]}>
                                            {bookingFeedback}
                                        </Text>
                                    )}

                                    <View style={styles.stepNavRow}>
                                        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                                            <Text style={styles.backBtnText}>Voltar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.nextBtn, { flex: 1 }, bookingMutation.isPending && styles.nextBtnDisabled]}
                                            disabled={bookingMutation.isPending}
                                            onPress={confirmBooking}
                                        >
                                            <Text style={styles.nextBtnText}>{bookingMutation.isPending ? 'Agendando...' : 'Confirmar'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:               { flex: 1, backgroundColor: '#f5f5f5' },

    header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
    avatarCircle:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ccc' },
    greeting:           { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    locationRow:        { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    location:           { fontSize: 12, color: '#888' },
    bellBtn:            { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

    searchBox:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8, marginBottom: 14 },
    searchInput:        { flex: 1, fontSize: 14, color: '#1a1a1a' },

    filtersRow:         { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
    filterChip:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
    filterChipActive:   { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
    filterText:         { fontSize: 13, color: '#666' },
    filterTextActive:   { color: '#fff', fontWeight: '600' },

    sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
    sectionTitle:       { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    seeAll:             { fontSize: 13, color: '#ffb300', fontWeight: '600' },

    topShopsRow:         { paddingHorizontal: 16, gap: 12, paddingBottom: 20 },
    shopCard:            { width: 160, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', padding: 10 },
    shopCardFeatured:    { width: 175, borderWidth: 2, borderColor: '#ffb300' },
    shopImage:           { width: '100%', height: 100, backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 8, justifyContent: 'flex-end' },
    shopImageFeatured:   { backgroundColor: '#c9a96e' },
    featuredBadge:       { backgroundColor: '#ffb300', paddingHorizontal: 8, paddingVertical: 3, borderTopLeftRadius: 6, borderTopRightRadius: 6, alignSelf: 'flex-start', margin: 6 },
    featuredBadgeText:   { fontSize: 10, fontWeight: '800', color: '#1a1a1a' },
    shopName:            { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
    shopNameFeatured:    { color: '#b8860b' },
    ratingRow:           { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    ratingText:          { fontSize: 12, color: '#666' },
    shopTag:             { fontSize: 11, color: '#888', marginTop: 2 },

    offersSection:       { backgroundColor: '#1a1a2e', paddingVertical: 16, marginBottom: 16 },
    offersSectionTitle:  { fontSize: 16, fontWeight: 'bold', color: '#fff', paddingHorizontal: 16, marginBottom: 12 },
    offersRow:           { paddingHorizontal: 16, gap: 12 },
    offerCard:           { width: 220, backgroundColor: '#16213e', borderRadius: 12, overflow: 'hidden', padding: 12 },
    offerImage:          { width: '100%', height: 100, backgroundColor: '#0f3460', borderRadius: 8, marginBottom: 10 },
    offerShop:           { fontSize: 11, color: '#ffb300', fontWeight: '600', marginBottom: 4 },
    offerDiscount:       { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    offerDays:           { fontSize: 11, color: '#aaa', marginTop: 2 },
    offerCode:           { fontSize: 11, color: '#ccc', marginTop: 4 },

    tabsRow:            { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    tab:                { flex: 1, alignItems: 'center', paddingBottom: 10 },
    tabText:            { fontSize: 14, color: '#888' },
    tabTextActive:      { color: '#1a1a1a', fontWeight: '700' },
    tabUnderline:       { position: 'absolute', bottom: 0, width: '60%', height: 2, backgroundColor: '#ffb300', borderRadius: 2 },

    listContainer:       { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
    listCard:            { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
    listCardFeatured:    { borderWidth: 2, borderColor: '#ffb300' },
    listImage:           { width: 110, backgroundColor: '#e0e0e0' },
    listImageFeatured:   { backgroundColor: '#c9a96e' },
    listInfo:            { flex: 1, padding: 12 },
    listNameRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    listName:            { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
    topBadge:            { backgroundColor: '#ffb300', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
    topBadgeText:        { fontSize: 10, fontWeight: '900', color: '#1a1a1a' },
    listMeta:            { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
    listMetaText:        { fontSize: 11, color: '#888' },
    serviceTagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
    serviceTag:          { backgroundColor: '#f0f0f0', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
    serviceTagText:      { fontSize: 10, color: '#555' },
    discountBadge:       { alignSelf: 'flex-start', backgroundColor: '#fff3cd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    discountText:        { fontSize: 11, color: '#856404', fontWeight: '700' },
    bookBtn:             { marginTop: 8, backgroundColor: '#1a1a1a', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    bookBtnFeatured:     { backgroundColor: '#ffb300' },
    bookBtnText:         { color: '#fff', fontWeight: '700', fontSize: 13 },

    modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '92%' },
    modalHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle:          { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    modalSubtitle:       { fontSize: 13, color: '#888', marginTop: 2 },

    stepsRow:            { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 24 },
    stepItem:            { alignItems: 'center', gap: 4 },
    stepDot:             { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
    stepDotActive:       { backgroundColor: '#ffb300' },
    stepDotDone:         { backgroundColor: '#28a745' },
    stepDotText:         { fontSize: 12, fontWeight: '700', color: '#fff' },
    stepLabel:           { fontSize: 11, color: '#aaa' },
    stepLabelActive:     { color: '#ffb300', fontWeight: '600' },
    stepTitle:           { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 14 },

    serviceItem:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
    serviceItemActive:   { borderColor: '#ffb300', backgroundColor: '#fffbf0' },
    serviceItemName:     { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
    serviceItemNameActive: { color: '#b8860b' },
    serviceItemDuration: { fontSize: 12, color: '#888', marginTop: 2 },
    serviceItemPrice:    { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },

    datesRow:            { gap: 8, paddingVertical: 4 },
    dateChip:            { alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff', minWidth: 56 },
    dateChipActive:      { backgroundColor: '#ffb300', borderColor: '#ffb300' },
    dateChipWeekday:     { fontSize: 10, color: '#888' },
    dateChipDay:         { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    dateChipMonth:       { fontSize: 10, color: '#888' },
    dateChipTextActive:  { color: '#fff' },

    noSlots:             { textAlign: 'center', color: '#aaa', marginTop: 16, fontSize: 13 },
    slotsGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    slotChip:            { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
    slotChipActive:      { backgroundColor: '#ffb300', borderColor: '#ffb300' },
    slotText:            { fontSize: 13, fontWeight: '600', color: '#333' },
    slotTextActive:      { color: '#fff' },

    stepNavRow:          { flexDirection: 'row', gap: 12, marginTop: 20 },
    nextBtn:             { backgroundColor: '#ffb300', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    nextBtnDisabled:     { backgroundColor: '#e0e0e0' },
    nextBtnText:         { color: '#fff', fontWeight: '700', fontSize: 15 },
    backBtn:             { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginTop: 16 },
    backBtnText:         { color: '#666', fontWeight: '600' },

    summaryCard:         { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 },
    summaryRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    summaryLabel:        { flex: 1, fontSize: 14, color: '#888' },
    summaryValue:        { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },

    feedbackMsg:         { textAlign: 'center', fontSize: 13, borderRadius: 8, padding: 12, marginBottom: 8 },
    feedbackSuccess:     { backgroundColor: '#d4edda', color: '#155724' },
    feedbackError:       { backgroundColor: '#f8d7da', color: '#721c24' },
});
