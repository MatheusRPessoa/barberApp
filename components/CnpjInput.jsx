import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

export default function CpnjInput({ value, onChangeText }) {
    return (
        <>
            <Text style={styles.label}>CNPJ</Text>
            <TextInput placeholder="Digite seu CNPJ" style={styles.input} value={value} onChangeText={onChangeText} />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
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
