import RememberMeCheckBox from '@/components/Checkbox';
import EmailInput from '@/components/EmailInput';
import PasswordInput from '@/components/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { Link } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, Image, StyleSheet, Text, View } from "react-native";

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    async function handleLogin() {
        if(!email || !senha) {
            Alert.alert('Atenção', 'Preencha e-mail e senha.');
            return;
        }
        setLoading(true);
        try {
            await login(email, senha);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Usuário ou senha inválidos';
            Alert.alert('Erro', message);
        } finally {
            setLoading(false);
        }
    }

    return (
        
        <View style={styles.container}>

            <Image source={require('@/assets/images/barb-logo.png')} style={styles.iconLogin} />
            
            <Text style={styles.title}>Bem vindo ao BarberApp</Text>
            <Text style={styles.slogan}>Faça o login para continuar</Text>
            
            <EmailInput value={email} onChangeText={setEmail} />
            <PasswordInput value={senha} onChangeText={setSenha} />
            
            <RememberMeCheckBox />

            <Button 
                title={loading ? 'Entrando...' : 'Entrar'} 
                color="#ffb300"
                onPress={handleLogin}
                disabled={loading} 
            />
            <View style={styles.row}>
                <Text>Ainda não tem uma conta?</Text>
                <Link href="/register" asChild>
                    <Text style={styles.textRegister}>Registre-se</Text>
                </Link>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 2,
    textAlign: 'center',
  },
  iconLogin: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 30,
  },
  textRegister: {
    color: '#212529',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  slogan: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#455A63',
    fontSize: 14,
  },
});


