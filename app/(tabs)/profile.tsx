import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.avatar} />
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <TouchableOpacity style={styles.btn} onPress={logout}>
                    <Text style={styles.btnText}>Sair</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f5f5f5' },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ccc', marginBottom: 16 },
    name: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
    email: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 32 },
    btn: { backgroundColor: '#ffb300', paddingVertical: 14, paddingHorizontal: 48, borderRadius: 10 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
