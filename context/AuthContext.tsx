import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, RegisterData, User } from '@/services/authService';

interface AuthContextData {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    pendingMessage: string;
    clearPendingMessage: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingMessage, setPendingMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        restoreSession();
    }, []);

    async function restoreSession() {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                const userData = await authService.me();
                setUser(userData);
            }
        } catch {
            await clearTokens();
        } finally {
            setLoading(false);
        }
    }

    async function saveTokens(accessToken: string, refreshToken: string) {
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
    }

    async function clearTokens() {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
    }

    async function login(email: string, password: string) {
        const { accessToken, refreshToken, user } = await authService.login(email, password);
        await saveTokens(accessToken, refreshToken);
        const fullUser = await authService.me();
        setUser(fullUser);
        router.replace(user.type === 'BARBER' ? '/home' : '/client-home');
    }

    async function register(data: RegisterData) {
        await authService.register(data);
        setPendingMessage('Conta criada com sucesso! Faça login para continuar')
        router.replace({ pathname: '/login', params: { registered: 'true' } });
    }

    async function logout() {
        try {
            if (user?.id) await authService.logout(user.id);
        } finally {
            await clearTokens();
            setUser(null);
            router.replace('/login');
        }
    }

    async function refreshUser() {
        const userData = await authService.me();
        setUser(userData);
    }

    function clearPendingMessage() {
        setPendingMessage('');
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            refreshUser,
            pendingMessage,
            clearPendingMessage
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
