import { C } from '@/constants/Colors';
import { BARBER_REAONS, CLIENT_REASONS } from '@/constants/cancelReasons';
import { useAuth } from '@/context/AuthContext';
import { appointmentService } from '@/services/appointmentService';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function CancelModal({
    visible,
    appointmentId,
    onClose,
    onCancelled,
}: {
    visible: boolean;
    appointmentId: string | null;
    onClose: () => void;
    onCancelled?: () => void;
}) {
    const { user } = useAuth();
    const reasons = user?.type === 'BARBER' ? BARBER_REAONS : CLIENT_REASONS;
    const queryClient = useQueryClient();

    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    function reset() {
        setReason('');
        setNote('');
        setError('');
    }

    function handleClose() {
        reset();
        onClose();
    }

    const mutation = useMutation({
        mutationFn: () =>
            appointmentService.updateStatus(appointmentId!, 'CANCELLED', {
                CANCEL_REASON: reason,
                ...(note.trim() !== '' && { CANCEL_NOTE: note.trim() }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-mine'] });
            reset();
            onClose();
            onCancelled?.();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('note required')) setError('Descreva o motivo no campo abaixo.');
            else if (msg.includes('transition')) setError('Este agendamento não pode mais ser cancelado.');
            else if (msg.includes('Forbidden')) setError('Você não tem permissão para cancelar este agendamento.');
            else setError(msg || 'Não foi possível cancelar. Tente novamente.');
        },
    });

    function handleConfirm() {
        if (!reason) {
            setError('Selecione um motivo.');
            return;
        }
        if (reason === 'OTHER' && note.trim() === '') {
            setError('Descreva o motivo no campo abaixo.');
            return;
        }
        setError('');
        mutation.mutate();
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>Cancelar agendamento</Text>
                    <Text style={styles.subtitle}>Selecione o motivo do cancelamento</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {reasons.map((r) => (
                            <TouchableOpacity key={r.code} style={styles.reasonRow} onPress={() => setReason(r.code)}>
                                <Ionicons
                                    name={reason === r.code ? 'radio-button-on' : 'radio-button-off'}
                                    size={20}
                                    color={reason === r.code ? C.primary : C.textMuted}
                                />
                                <Text style={styles.reasonLabel}>{r.label}</Text>
                            </TouchableOpacity>
                        ))}

                        {reason === 'OTHER' && (
                            <TextInput
                                style={styles.input}
                                placeholder="Descreva o motivo"
                                placeholderTextColor={C.textFaint}
                                value={note}
                                onChangeText={setNote}
                                multiline
                                maxLength={300}
                            />
                        )}

                        {error !== '' && <Text style={styles.error}>{error}</Text>}
                    </ScrollView>

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                            <Text style={styles.btnCancelText}>Voltar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnConfirm, mutation.isPending && styles.btnDisabled]}
                            disabled={mutation.isPending}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.btnConfirmText}>
                                {mutation.isPending ? 'Cancelando...' : 'Cancelar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: C.bgSurface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    title: { fontSize: 18, fontWeight: 'bold', color: C.textPrimary },
    subtitle: { fontSize: 13, color: C.textMuted, marginTop: 4, marginBottom: 16 },
    reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    reasonLabel: { fontSize: 15, color: C.textPrimary },
    input: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        padding: 12,
        minHeight: 70,
        textAlignVertical: 'top',
        fontSize: 14,
        color: C.textPrimary,
        marginTop: 8,
    },
    error: { color: C.danger, fontSize: 13, marginTop: 12 },
    row: { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginTop: 20 },
    btnCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    btnCancelText: { color: C.textSecondary, fontWeight: '600' },
    btnConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: C.danger, alignItems: 'center' },
    btnConfirmText: { color: C.bgSurface, fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
});
