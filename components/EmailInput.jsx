import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

export default function EmailInput({ value, onChangeText }) {
    return (
        <>
            <Text style={styles.label}>Email</Text>
            <TextInput
                placeholder="Digite seu email"
                value={value}
                onChangeText={onChangeText}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </>
    );
}

const styles = StyleSheet.create({
    label: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
});
