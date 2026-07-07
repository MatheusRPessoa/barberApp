import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Checkbox } from 'react-native-paper';

export default function AccountType({ value, onChange }) {
    return (
        <View style={styles.container}>
            <Checkbox
                status={value === 'CLIENT' ? 'checked' : 'unchecked'}
                onPress={() => onChange('CLIENT')}
                color="#007bff"
            />
            <Text>Cliente</Text>
            <Checkbox
                status={value === 'BARBER' ? 'checked' : 'unchecked'}
                onPress={() => onChange('BARBER')}
                color="#007bff"
            />
            <Text>Barbeiro</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
});
