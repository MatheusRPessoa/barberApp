import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const fullSchedule = [
    { time: '09:00', name: 'Carlos Silva',   service: 'Haircut',         status: 'Completed' },
    { time: '10:00', name: 'Mike Johnson',   service: 'Haircut',         status: 'Completed' },
    { time: '11:30', name: 'David Brown',    service: 'Beard Trim',      status: 'Completed' },
    { time: '13:00', name: 'Lucas Souza',    service: 'Hair + Beard',    status: 'Completed' },
    { time: '14:30', name: 'John Smith',     service: 'Haircut + Beard', status: 'Upcoming'  },
    { time: '16:00', name: 'Robert Davis',   service: 'Hair Styling',    status: 'Upcoming'  },
    { time: '17:30', name: 'Pedro Alves',    service: 'Haircut',         status: 'Upcoming'  },
];

export default function Schedule() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Full Schedule</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {fullSchedule.map((item, index) => (
                    <View key={index} style={styles.item}>
                        <Text style={styles.time}>{item.time}</Text>
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.service}>{item.service}</Text>
                        </View>
                        <View style={[styles.badge, item.status === 'Completed' ? styles.badgeGreen : styles.badgeRed]}>
                            <Text style={styles.badgeText}>{item.status}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12, color: '#1a1a1a' },
    scroll: { padding: 16 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
    },
    time: { width: 52, fontSize: 14, fontWeight: '600', color: '#ffb300' },
    info: { flex: 1, marginLeft: 8 },
    name: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    service: { fontSize: 13, color: '#888', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeGreen: { backgroundColor: '#28a745' },
    badgeRed: { backgroundColor: '#dc3545' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
