import AccountType from "@/components/AccountType";
import CnpjInput from "@/components/CnpjInput";
import EmailInput from "@/components/EmailInput";
import FullNameInput from "@/components/FullNameInput";
import PasswordConfirm from "@/components/PasswordConfirm";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'CLIENT' | 'BARBER'>('CLIENT');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function criarConta() {
    if (!nome || !email || !password || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (accountType === 'BARBER' && !cnpj) {
      Alert.alert('Atenção', 'Barbeiros precisam informar o nome da barbearia.');
      return;
    }

    setLoading(true);
    try {
      await register({
        NAME: nome,
        EMAIL: email,
        PASSWORD: password,
        TYPE: accountType,
        ...(accountType === 'BARBER' && { SHOP_NAME: cnpj }),
      });
    } catch (err: any) {
      Alert.alert('Erro ao criar conta', err.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar Conta</Text>
        </View>

        <FullNameInput value={nome} onChangeText={setNome} />
        <EmailInput value={email} onChangeText={setEmail} />

        <Text style={styles.label}>Tipo de conta</Text>
        <AccountType value={accountType} onChange={setAccountType} />

        {accountType === 'BARBER' && (
          <>
            <Text style={styles.label}>Nome da Barbearia</Text>
            <CnpjInput value={cnpj} onChangeText={setCnpj} />
          </>
        )}

        <PasswordInput value={password} onChangeText={setPassword} />
        <PasswordConfirm value={confirmPassword} onChangeText={setConfirmPassword} />

        <Button
          title={loading ? 'Criando conta...' : 'Criar Conta'}
          color="#ffb300"
          onPress={criarConta}
          disabled={loading}
        />

        <View style={styles.row}>
          <Text>Já possui uma conta?</Text>
          <Link href="/login" asChild>
            <Text style={styles.textRegister}>Faça o login</Text>
          </Link>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    flexGrow: 1,
  },
  label: {
    fontWeight: 'bold',
  },
  textRegister: {
    color: '#212529',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
