import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime:            10_000,  // dado fresco por 10s
            refetchOnWindowFocus: true,
            retry:                1,
        },
    },
});

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </AuthProvider>
        </QueryClientProvider>
    );
}
