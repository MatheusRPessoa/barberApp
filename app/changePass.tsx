import { useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function ChangePass() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Página mudar senha</Text>

            <Button title="voltar" onPress={() => router.back()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0f7fa',
    },
    text: {
        fontSize: 24,
        marginTop: 20,
    },
});
