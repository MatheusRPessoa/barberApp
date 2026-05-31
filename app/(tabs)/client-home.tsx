import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientHome() {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>Olá, {user?.name} 👋</Text>
                <Text style={styles.subtitle}>Tela do cliente em construção</Text>
                <TouchableOpacity style={styles.btn} onPress={logout}>
                    <Text style={styles.btnText}>Sair</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f5f5f5' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#888', marginBottom: 40 },
    btn: { backgroundColor: '#ffb300', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
