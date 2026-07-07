import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { NotificationsProvider } from '@/context/NotificationsContext'; //

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            retry: 1,
        },
    },
});

function AppStack() {
    const { user } = useAuth();
    useNotifications(!!user);
    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NotificationsProvider>
                    <AppStack />
                </NotificationsProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
