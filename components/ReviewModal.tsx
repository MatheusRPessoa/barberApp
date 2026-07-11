import { C } from '@/constants/Colors';
import { appointmentService } from '@/services/appointmentService';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, View, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';

export default function ReviewModal({
    visible,
    appointmentId,
    shopName,
    onClose,
}: {
    visible: boolean;
    appointmentId: string | null;
    shopName: string;
    onClose: () => void;
}) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () =>
            appointmentService.review(appointmentId!, { RATING: rating, COMMENT: comment.trim() || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments-mine'] });
            queryClient.invalidateQueries({ queryKey: ['barbers'] });
            handleClose();
        },
        onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao enviar avaliação.'),
    });

    function handleClose() {
        setRating(0);
        setComment('');
        setError('');
        onClose();
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>Avaliar atendimento</Text>
                    <Text style={styles.subtitle}>{shopName}</Text>

                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6}>
                                <Ionicons
                                    name={n <= rating ? 'star' : 'star-outline'}
                                    size={36}
                                    color={n <= rating ? C.primary : C.borderInput}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Comentário (opcional)"
                        placeholderTextColor={C.textFaint}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        maxLength={500}
                    />

                    {error !== '' && <Text style={styles.error}>{error}</Text>}

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                            <Text style={styles.btnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnConfirm, (rating === 0 || mutation.isPending) && styles.btnDisabled]}
                            disabled={rating === 0 || mutation.isPending}
                            onPress={() => mutation.mutate()}
                        >
                            <Text style={styles.btnConfirmText}>{mutation.isPending ? 'Enviando...' : 'Enviar'}</Text>
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
    subtitle: { fontSize: 13, color: C.textMuted, marginTop: 2, marginBottom: 20 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        color: C.textPrimary,
    },
    error: { color: C.danger, fontSize: 13, marginTop: 10 },
    row: { flexDirection: 'row', gap: 12, marginTop: 20 },
    btnCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    btnCancelText: { color: C.textSecondary, fontWeight: '600' },
    btnConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center' },
    btnConfirmText: { color: C.bgSurface, fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
});
