import { useAuth } from '@/context/AuthContext';
import { appointmentService } from '@/services/appointmentService';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
    const { user } = useAuth();
    const isBarber = user?.type === 'BARBER';

    const { data: allAppointments = [] } = useQuery({
        queryKey: ['appointments-all'],
        queryFn:  () => appointmentService.list(),
        enabled:  isBarber,
        refetchInterval:      30_000,
        refetchOnWindowFocus: true,
    });

    const pendingCount = allAppointments.filter(
        (a: any) => a.appointment_status === 'PENDING'
    ).length;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ffb300',
                tabBarInactiveTintColor: '#888',
                tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee', height: 60 },
                tabBarLabelStyle: { fontSize: 11, marginBottom: 6 },
            }}
        >
            {/* Tab Home — barber vê home, client vê client-home */}
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    href: isBarber ? undefined : null,
                    tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="client-home"
                options={{
                    title: 'Home',
                    href: isBarber ? null : undefined,
                    tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                }}
            />

            {/* Cupons — ambos */}
            <Tabs.Screen
                name="coupons"
                options={{
                    title: 'Cupons',
                    tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} />,
                }}
            />

            {/* Agenda — só barbeiro */}
            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Agenda',
                    href: isBarber ? undefined : null,
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                    tabBarBadge: isBarber && pendingCount > 0 ? pendingCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: '#ffb300', color: '#fff', fontSize: 10 },
                }}
            />

            {/* Agendamentos — só cliente */}
            <Tabs.Screen
                name="my-appointments"
                options={{
                    title: 'Agendamentos',
                    href: isBarber ? null : undefined,
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                }}
            />

            {/* Perfil — ambos */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                }}
            />

            {/* Telas sem tab */}
            <Tabs.Screen name="index"    options={{ href: null }} />
            <Tabs.Screen name="login"    options={{ href: null }} />
            <Tabs.Screen name="register" options={{ href: null }} />
            <Tabs.Screen name="sobre"    options={{ href: null }} />
        </Tabs>
    );
}
