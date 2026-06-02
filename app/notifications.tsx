import { C } from '@/constants/Colors';
import { useNotificationsContext } from '@/context/NotificationsContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return 'agora mesmo';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, markAllRead } = useNotificationsContext();

    useEffect(() => {
        markAllRead();
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificações</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={48} color={C.borderLight} />
                        <Text style={styles.emptyText}>Nenhuma notificação ainda.</Text>
                    </View>
                ) : (
                    notifications.map(n => (
                        <View key={n.id} style={[styles.card, !n.read && styles.cardUnread]}>
                            <View style={styles.iconBox}>
                                <Ionicons name="calendar-outline" size={22} color={C.primary} />
                            </View>
                            <View style={styles.content}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.title}>{n.title}</Text>
                                    {!n.read && <View style={styles.dot} />}
                                </View>
                                <Text style={styles.body}>{n.body}</Text>
                                <Text style={styles.time}>{timeAgo(n.receivedAt)}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:           { flex: 1, backgroundColor: C.bgPage },
    header:         { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.bgSurface, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 12 },
    backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgPage, alignItems: 'center', justifyContent: 'center' },
    headerTitle:    { fontSize: 17, fontWeight: 'bold', color: C.textPrimary },
    scroll:         { padding: 16, gap: 10, flexGrow: 1 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
    emptyText:      { fontSize: 14, color: C.textFaint },
    card:           { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 12, padding: 14, gap: 12 },
    cardUnread:     { borderLeftWidth: 3, borderLeftColor: C.primary },
    iconBox:        { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' },
    content:        { flex: 1 },
    titleRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    title:          { fontSize: 14, fontWeight: '700', color: C.textPrimary, flex: 1 },
    dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
    body:           { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
    time:           { fontSize: 11, color: C.textFaint, marginTop: 4 },
});
