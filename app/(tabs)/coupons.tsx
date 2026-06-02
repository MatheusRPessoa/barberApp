import { C } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Coupons() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>Cupons</Text>
                <Text style={styles.subtitle}>Em breve</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bgPage },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', color: C.textPrimary },
    subtitle: { fontSize: 14, color: C.textMuted, marginTop: 8 },
});
