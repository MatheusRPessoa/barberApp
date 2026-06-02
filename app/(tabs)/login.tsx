import { C } from '@/constants/Colors';
import RememberMeCheckBox from '@/components/Checkbox';
import EmailInput from '@/components/EmailInput';
import PasswordInput from '@/components/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Button, Image, StyleSheet, Text, View } from "react-native";

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const { login, pendingMessage, clearPendingMessage } = useAuth();
    const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('error');

    function showFeedback(msg: string, type: 'success' | 'error' = 'error') {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setTimeout(() => setFeedbackMsg(''), 4000);
    }

    useEffect(() => {
        if (pendingMessage) {
            showFeedback(pendingMessage, 'success');
            clearPendingMessage();
        }
    }, [pendingMessage]);


    async function handleLogin() {
        if(!email || !senha) {
            showFeedback('Preencha e-mail e senha.');
            return;
        }
        setLoading(true);
        setFeedbackMsg('');
        try {
            await login(email, senha);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Usuário ou senha inválidos';
            showFeedback(message);
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

            {feedbackMsg !== '' && (
                <Text style={[styles.feedback, feedbackType === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
                    {feedbackMsg}
                </Text>
            )}

            <Button
                title={loading ? 'Entrando...' : 'Entrar'} 
                color={C.primary}
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
    backgroundColor: C.bgSurface,
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
    color: C.textLink,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  slogan: {
    textAlign: 'center',
    marginBottom: 30,
    color: C.textSlogan,
    fontSize: 14,
  },
  feedback: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
    borderRadius: 6,
    padding: 10,
  },
  feedbackSuccess: {
    backgroundColor: C.successBg,
    color: C.successText,
  },
  feedbackError: {
    backgroundColor: C.errorBg,
    color: C.errorText,
  },
});


