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
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
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
        setUser(user);
        router.replace(user.type === 'BARBER' ? '/home' : '/client-home');
    }

    async function register(data: RegisterData) {
        const { accessToken, refreshToken, user } = await authService.register(data);
        await saveTokens(accessToken, refreshToken);
        setUser(user);
        router.replace(user.type === 'BARBER' ? '/home' : '/client-home');
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

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
