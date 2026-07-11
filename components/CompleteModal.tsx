import { C } from '@/constants/Colors';
import { appointmentService } from '@/services/appointmentService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Modal, StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function CompleteModal({
    visible,
    appointmentId,
    onClose,
    onCompleted,
}: {
    visible: boolean;
    appointmentId: string | null;
    onClose: () => void;
    onCompleted?: () => void;
}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [blocked, setBlocked] = useState(false);
    const queryClient = useQueryClient();

    function reset() {
        setCode('');
        setError('');
        setBlocked(false);
    }

    function handleClose() {
        reset();
        onClose();
    }

    const mutation = useMutation({
        mutationFn: () => appointmentService.updateStatus(appointmentId!, 'COMPLETED', { COMPLETION_CODE: code }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-mine'] });
            reset();
            onClose();
            onCompleted?.();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('Too many attempts')) {
                setBlocked(true);
                setError('Muitas tentativas. Tente novamente em alguns minutos.');
            } else if (msg.includes('Invalid completion code')) {
                setError('Código incorreto. Confira com o cliente');
                setCode('');
            } else if (msg.toLowerCase().includes('required') || msg.includes('4 digits')) {
                setError('Informe os 4 dígitos do código.');
            } else if (msg.includes('Forbidden')) {
                setError('Você não tem permissão para concluir este agendamento');
            } else {
                setError(msg || 'Não foi possível concluir. Tente novamente.');
            }
        },
    });

    function handleConfirm() {
        if (!/^\d{4}$/.test(code)) {
            setError('O código tem 4 dígitos numéricos.');
            return;
        }
        setError('');
        mutation.mutate();
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>Concluir atendimento</Text>
                    <Text style={styles.subtitle}>Peça ao cliente o código de conclusão</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="0000"
                        placeholderTextColor={C.textFaint}
                        value={code}
                        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        editable={!blocked}
                    />

                    {error !== '' && <Text style={styles.error}>{error}</Text>}

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                            <Text style={styles.btnCancelText}>Voltar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnConfirm, (mutation.isPending || blocked) && styles.btnDisabled]}
                            disabled={mutation.isPending || blocked}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.btnConfirmText}>
                                {mutation.isPending ? 'Concluindo...' : 'Concluir'}
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
    },
    title: { fontSize: 18, fontWeight: 'bold', color: C.textPrimary },
    subtitle: { fontSize: 13, color: C.textMuted, marginTop: 4, marginBottom: 16 },
    input: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        paddingVertical: 14,
        textAlign: 'center',
        fontSize: 28,
        letterSpacing: 12,
        fontWeight: '700',
        color: C.textPrimary,
    },
    error: { color: C.danger, fontSize: 13, marginTop: 12 },
    row: { flexDirection: 'row', gap: 12, marginTop: 20 },
    btnCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    btnCancelText: { color: C.textSecondary, fontWeight: '600' },
    btnConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: C.success, alignItems: 'center' },
    btnConfirmText: { color: C.bgSurface, fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
});
