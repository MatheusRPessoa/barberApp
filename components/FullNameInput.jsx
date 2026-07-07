import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

export default function FullNameInput({ value, onChangeText }) {
    return (
        <>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
                placeholder="Digite seu nome completo"
                value={value}
                onChangeText={onChangeText}
                style={styles.input}
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
