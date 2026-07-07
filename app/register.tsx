import { C } from '@/constants/Colors';
import { maskCep, maskCpf } from '@/utils/masks';
import AccountType from '@/components/AccountType';
import CnpjInput from '@/components/CnpjInput';
import EmailInput from '@/components/EmailInput';
import FullNameInput from '@/components/FullNameInput';
import PasswordConfirm from '@/components/PasswordConfirm';
import PasswordInput from '@/components/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const commonFields = {
    nome: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha mínima de 6 caracteres'),
    confirmPassword: z.string(),
};

const addressFields = {
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().length(2, 'UF deve ter 2 letras'),
    zipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido (00000-000)'),
    complement: z.string().optional(),
};

const clientSchema = z
    .object({
        ...commonFields,
        accountType: z.literal('CLIENT'),
        cpf: z.string().regex(/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/, 'CPF inválido (000.000.000-00)'),
        ...addressFields,
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'As senhas não coincidem',
        path: ['confirmPassword'],
    });

const barberSchema = z
    .object({
        ...commonFields,
        accountType: z.literal('BARBER'),
        shopName: z.string().min(1, 'Nome da barbearia é obrigatório'),
        cnpj: z.string().min(14, 'CNPJ inválido'),
        ...addressFields,
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'As senhas não coincidem',
        path: ['confirmPassword'],
    });

const registerSchema = z.discriminatedUnion('accountType', [clientSchema, barberSchema]);

export default function Register() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [shopName, setShopName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [cpf, setCpf] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accountType, setAccountType] = useState<'CLIENT' | 'BARBER'>('CLIENT');
    const [loading, setLoading] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('error');

    const { register } = useAuth();
    const router = useRouter();

    function showFeedback(msg: string, type: 'success' | 'error' = 'error') {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setTimeout(() => setFeedbackMsg(''), 4000);
    }

    async function makeAccount() {
        const result = registerSchema.safeParse({
            nome,
            email,
            password,
            confirmPassword,
            accountType,
            shopName,
            cnpj,
            cpf,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            zipCode,
        });

        if (!result.success) {
            showFeedback(result.error.issues[0].message);
            return;
        }

        setLoading(true);
        try {
            await register({
                NAME: nome,
                EMAIL: email,
                PASSWORD: password,
                TYPE: accountType,
                STREET: street,
                NUMBER: number,
                NEIGHBORHOOD: neighborhood,
                CITY: city,
                STATE: state.toUpperCase(),
                ZIP_CODE: zipCode,
                ...(accountType === 'BARBER'
                    ? { SHOP_NAME: shopName, CNPJ: cnpj, COMPLEMENT: complement }
                    : { CPF: cpf, ...(complement.trim() !== '' && { COMPLEMENT: complement }) }),
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : '';
            if (message.includes('Email already')) {
                showFeedback('Este e-mail já está cadastrado. Tente fazer login.');
            } else if (message.includes('CPF already')) {
                showFeedback('Este CPF já está cadastrado em outra conta.');
            } else {
                showFeedback(message || 'Tente novamente.');
            }
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

                {accountType === 'BARBER' ? (
                    <>
                        <Text style={styles.label}>Nome da Barbearia</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Barbearia do João"
                            value={shopName}
                            onChangeText={setShopName}
                        />
                        <CnpjInput value={cnpj} onChangeText={setCnpj} />
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>CPF</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="000.000.000-00"
                            value={cpf}
                            onChangeText={(v) => setCpf(maskCpf(v))}
                            keyboardType="numeric"
                            maxLength={14}
                        />
                    </>
                )}

                <Text style={styles.sectionLabel}>
                    {accountType === 'BARBER' ? 'Endereço da Barbearia' : 'Endereço'}
                </Text>
                <Text style={styles.label}>CEP</Text>
                <TextInput
                    style={styles.input}
                    placeholder="00000-000"
                    value={zipCode}
                    onChangeText={(v) => setZipCode(maskCep(v))}
                    keyboardType="numeric"
                    maxLength={9}
                />

                <View style={styles.row2col}>
                    <View style={{ flex: 2 }}>
                        <Text style={styles.label}>Rua</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Rua das Flores"
                            value={street}
                            onChangeText={setStreet}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>Número</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123"
                            value={number}
                            onChangeText={setNumber}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <Text style={styles.label}>Bairro</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Centro"
                    value={neighborhood}
                    onChangeText={setNeighborhood}
                />

                <View style={styles.row2col}>
                    <View style={{ flex: 2 }}>
                        <Text style={styles.label}>Cidade</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: São Paulo"
                            value={city}
                            onChangeText={setCity}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>UF</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="SP"
                            value={state}
                            onChangeText={setState}
                            maxLength={2}
                            autoCapitalize="characters"
                        />
                    </View>
                </View>

                <Text style={styles.label}>Complemento (opcional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Sala 2"
                    value={complement}
                    onChangeText={setComplement}
                />
                <PasswordInput value={password} onChangeText={setPassword} />
                <PasswordConfirm value={confirmPassword} onChangeText={setConfirmPassword} />

                {feedbackMsg !== '' && (
                    <Text
                        style={[
                            styles.feedback,
                            feedbackType === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                        ]}
                    >
                        {feedbackMsg}
                    </Text>
                )}

                <Button
                    title={loading ? 'Criando conta...' : 'Criar Conta'}
                    color={C.primary}
                    onPress={makeAccount}
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
    container: { padding: 15, flexGrow: 1 },
    label: { fontWeight: 'bold' },
    sectionLabel: {
        fontWeight: 'bold',
        fontSize: 15,
        color: C.primary,
        marginTop: 16,
        marginBottom: 8,
        borderTopWidth: 1,
        borderTopColor: C.borderLight,
        paddingTop: 16,
    },
    input: { borderWidth: 1, borderColor: C.borderInput, borderRadius: 8, padding: 10, marginBottom: 10 },
    row2col: { flexDirection: 'row', alignItems: 'flex-start' },
    textRegister: { color: C.textLink, fontWeight: 'bold', marginLeft: 2 },
    row: { flexDirection: 'row', justifyContent: 'center', margin: 25 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 10 },

    feedback: { textAlign: 'center', marginBottom: 12, fontSize: 13, borderRadius: 6, padding: 10 },
    feedbackSuccess: { backgroundColor: C.successBg, color: C.successText },
    feedbackError: { backgroundColor: C.errorBg, color: C.errorText },
});
