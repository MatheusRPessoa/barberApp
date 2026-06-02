import { C } from '@/constants/Colors';
import { appointmentService } from '@/services/appointmentService';
import { barberService, Service } from '@/services/barberService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function toLocalDate(date: Date) {
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
    const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const months   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const isToday  = dateStr === toLocalDate(new Date());
    return { label: isToday ? 'Hoje' : weekdays[d.getDay()], day: String(day).padStart(2,'0'), month: months[month - 1] };
}

const DATES = generateDates(14);

export default function Booking() {
    const router = useRouter();
    const { barberId, barberName } = useLocalSearchParams<{ barberId: string; barberName: string }>();
    const queryClient = useQueryClient();

    const [step, setStep]                         = useState<1|2|3>(1);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedDate, setSelectedDate]         = useState('');
    const [selectedTime, setSelectedTime]         = useState('');
    const [feedback, setFeedback]                 = useState('');
    const [feedbackIsError, setFeedbackIsError]   = useState(false);

    const { data: services = [], isLoading: loadingServices } = useQuery({
        queryKey: ['barber-services', barberId],
        queryFn:  () => barberService.listBarberServices(barberId),
        enabled:  !!barberId,
    });

    const { data: slotsData, isLoading: loadingSlots } = useQuery({
        queryKey: ['slots', barberId, selectedDate],
        queryFn:  () => barberService.getAvailableSlots(barberId, selectedDate),
        enabled:  !!selectedDate && !!barberId,
    });

    const slots = (() => {
        const raw = slotsData?.available ?? [];
        if (selectedDate !== toLocalDate(new Date())) return raw;
        const now = new Date();
        const cur = now.getHours() * 60 + now.getMinutes();
        return raw.filter(s => { const [h, m] = s.split(':').map(Number); return h * 60 + m > cur; });
    })();

    function toggleService(svc: Service) {
        setSelectedServices(prev =>
            prev.find(s => s.id === svc.id) ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
        );
    }

    const mutation = useMutation({
        mutationFn: () => appointmentService.create({
            BARBER_ID:   barberId,
            SERVICE_IDS: selectedServices.map(s => s.id),
            DATE:        selectedDate,
            TIME:        selectedTime,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments-mine'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-today'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-all'] });  
            setFeedbackIsError(false);
            setFeedback('Agendamento realizado! Aguarde a confirmação do barbeiro.');
            setTimeout(() => router.back(), 2500);
        },
        onError: (err: unknown) => {
            setFeedbackIsError(true);
            setFeedback(err instanceof Error ? err.message : 'Erro ao agendar. Tente novamente.');
        },
    });

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Agendar Horário</Text>
                    <Text style={styles.headerSub}>{barberName}</Text>
                </View>
            </View>

            {/* Steps */}
            <View style={styles.stepsRow}>
                {['Serviço','Data','Confirmar'].map((label, i) => (
                    <View key={label} style={styles.stepItem}>
                        <View style={[styles.stepDot, step > i+1 && styles.stepDotDone, step === i+1 && styles.stepDotActive]}>
                            <Text style={styles.stepDotText}>{step > i+1 ? '✓' : i+1}</Text>
                        </View>
                        <Text style={[styles.stepLabel, step === i+1 && styles.stepLabelActive]}>{label}</Text>
                    </View>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {step === 1 && (
                    <View>
                        <Text style={styles.stepTitle}>Escolha o serviço</Text>
                        {loadingServices ? (
                            <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
                        ) : services.length === 0 ? (
                            <Text style={styles.empty}>Nenhum serviço cadastrado nesta barbearia.</Text>
                        ) : (
                            services.map(s => {
                                const selected = !!selectedServices.find(x => x.id === s.id);
                                return (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.serviceItem, selected && styles.serviceItemActive]}
                                        onPress={() => toggleService(s)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.serviceItemName, selected && styles.serviceItemNameActive]}>{s.name}</Text>
                                            <Text style={styles.serviceItemDuration}>{s.duration_minutes} min</Text>
                                        </View>
                                        <Text style={[styles.serviceItemPrice, selected && styles.serviceItemNameActive]}>
                                            R$ {Number(s.price ?? 0).toFixed(2)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                        <TouchableOpacity
                            style={[styles.nextBtn, !selectedServices.length && styles.nextBtnDisabled]}
                            disabled={!selectedServices.length}
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
                                        <Text style={[styles.dateChipDay,     selectedDate === d && styles.dateChipTextActive]}>{chip.day}</Text>
                                        <Text style={[styles.dateChipMonth,   selectedDate === d && styles.dateChipTextActive]}>{chip.month}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        {selectedDate !== '' && (
                            <>
                                <Text style={[styles.stepTitle, { marginTop: 16 }]}>Escolha o horário</Text>
                                {loadingSlots ? (
                                    <ActivityIndicator color={C.primary} style={{ marginTop: 12 }} />
                                ) : slots.length === 0 ? (
                                    <Text style={styles.empty}>Nenhum horário disponível nesta data.</Text>
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
                        <View style={styles.navRow}>
                            <TouchableOpacity style={styles.backBtn2} onPress={() => setStep(1)}>
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
                            {[
                                { icon: 'storefront-outline' as const, label: 'Barbearia', value: barberName },
                                { icon: 'cut-outline' as const,        label: 'Serviços',  value: selectedServices.map(s => s.name).join(' + ') },
                                { icon: 'calendar-outline' as const,   label: 'Data',      value: selectedDate?.split('-').reverse().join('/') },
                                { icon: 'time-outline' as const,       label: 'Horário',   value: selectedTime },
                            ].map((row, i, arr) => (
                                <View key={row.label} style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                                    <Ionicons name={row.icon} size={18} color={C.primary} />
                                    <Text style={styles.summaryLabel}>{row.label}</Text>
                                    <Text style={styles.summaryValue}>{row.value}</Text>
                                </View>
                            ))}
                            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                                <Ionicons name="cash-outline" size={18} color={C.primary} />
                                <Text style={styles.summaryLabel}>Valor</Text>
                                <Text style={[styles.summaryValue, { color: C.success, fontWeight: '700' }]}>
                                    R$ {selectedServices.reduce((sum, s) => sum + Number(s.price ?? 0), 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        {feedback !== '' && (
                            <Text style={[styles.feedbackMsg, feedbackIsError ? styles.feedbackError : styles.feedbackSuccess]}>
                                {feedback}
                            </Text>
                        )}
                        <View style={styles.navRow}>
                            <TouchableOpacity style={styles.backBtn2} onPress={() => setStep(2)}>
                                <Text style={styles.backBtnText}>Voltar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.nextBtn, { flex: 1 }, mutation.isPending && styles.nextBtnDisabled]}
                                disabled={mutation.isPending}
                                onPress={() => mutation.mutate()}
                            >
                                <Text style={styles.nextBtnText}>{mutation.isPending ? 'Agendando...' : 'Confirmar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:                 { flex: 1, backgroundColor: C.bgPage },
    header:               { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.bgSurface, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 12 },
    backBtn:              { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgPage, alignItems: 'center', justifyContent: 'center' },
    headerTitle:          { fontSize: 17, fontWeight: 'bold', color: C.textPrimary },
    headerSub:            { fontSize: 13, color: C.textMuted, marginTop: 2 },
    stepsRow:             { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingVertical: 20, backgroundColor: C.bgSurface, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    stepItem:             { alignItems: 'center', gap: 4 },
    stepDot:              { width: 28, height: 28, borderRadius: 14, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
    stepDotActive:        { backgroundColor: C.primary },
    stepDotDone:          { backgroundColor: C.success },
    stepDotText:          { fontSize: 12, fontWeight: '700', color: C.bgSurface },
    stepLabel:            { fontSize: 11, color: C.textFaint },
    stepLabelActive:      { color: C.primary, fontWeight: '600' },
    scroll:               { padding: 20, paddingBottom: 40 },
    stepTitle:            { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 14 },
    empty:                { textAlign: 'center', color: C.textFaint, marginTop: 20, fontSize: 13 },
    serviceItem:          { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: C.borderLight, marginBottom: 10 },
    serviceItemActive:    { borderColor: C.primary, backgroundColor: C.primaryBg },
    serviceItemName:      { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    serviceItemNameActive:{ color: C.primaryDark },
    serviceItemDuration:  { fontSize: 12, color: C.textMuted, marginTop: 2 },
    serviceItemPrice:     { fontSize: 15, fontWeight: '700', color: C.textPrimary },
    datesRow:             { gap: 8, paddingVertical: 4 },
    dateChip:             { alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.borderLight, backgroundColor: C.bgSurface, minWidth: 56 },
    dateChipActive:       { backgroundColor: C.primary, borderColor: C.primary },
    dateChipWeekday:      { fontSize: 10, color: C.textMuted },
    dateChipDay:          { fontSize: 18, fontWeight: 'bold', color: C.textPrimary },
    dateChipMonth:        { fontSize: 10, color: C.textMuted },
    dateChipTextActive:   { color: C.bgSurface },
    slotsGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    slotChip:             { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: C.borderLight, backgroundColor: C.bgSurface },
    slotChipActive:       { backgroundColor: C.primary, borderColor: C.primary },
    slotText:             { fontSize: 13, fontWeight: '600', color: C.textTertiary },
    slotTextActive:       { color: C.bgSurface },
    navRow:               { flexDirection: 'row', gap: 12, marginTop: 20 },
    nextBtn:              { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    nextBtnDisabled:      { backgroundColor: C.bgDisabled },
    nextBtnText:          { color: C.bgSurface, fontWeight: '700', fontSize: 15 },
    backBtn2:             { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', marginTop: 16 },
    backBtnText:          { color: C.textSecondary, fontWeight: '600' },
    summaryCard:          { backgroundColor: C.bgSubtle, borderRadius: 12, padding: 16, marginBottom: 16 },
    summaryRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    summaryLabel:         { flex: 1, fontSize: 14, color: C.textMuted },
    summaryValue:         { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    feedbackMsg:          { textAlign: 'center', fontSize: 13, borderRadius: 8, padding: 12, marginBottom: 8 },
    feedbackSuccess:      { backgroundColor: C.successBg, color: C.successText },
    feedbackError:        { backgroundColor: C.errorBg, color: C.errorText },
});
