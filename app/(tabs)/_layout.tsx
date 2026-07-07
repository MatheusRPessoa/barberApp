import { C } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appointment, appointmentService } from '@/services/appointmentService';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
    const { user, loading } = useAuth();
    const isBarber = user?.type === 'BARBER';
    const insets = useSafeAreaInsets();

    const { data: allAppointments = [] } = useQuery({
        queryKey: ['appointments-all'],
        queryFn: () => appointmentService.list(),
        enabled: !!user && isBarber,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });

    const { data: myAppointments = [] } = useQuery({
        queryKey: ['appointments-mine'],
        queryFn: () => appointmentService.listMine(),
        enabled: !!user && !isBarber,
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    const pendingCount = allAppointments.filter((a: Appointment) => a.appointment_status === 'PENDING').length;

    const clientPendingCount = myAppointments.filter((a: Appointment) => a.appointment_status === 'PENDING').length;

    if (!loading && !user) {
        return <Redirect href="/login" />;
    }

    return (
        <Tabs
            backBehavior="initialRoute"
            initialRouteName={isBarber ? 'home' : 'client-home'}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: C.primary,
                tabBarInactiveTintColor: C.textMuted,
                tabBarStyle: {
                    backgroundColor: C.bgSurface,
                    borderTopColor: C.borderLight,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                },
                tabBarLabelStyle: { fontSize: 11, marginBottom: 6 },
            }}
        >
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

            <Tabs.Screen
                name="coupons"
                options={{
                    title: 'Cupons',
                    tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} />,
                }}
            />

            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Agenda',
                    href: isBarber ? undefined : null,
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                    tabBarBadge: isBarber && pendingCount > 0 ? pendingCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: C.primary, color: C.bgSurface, fontSize: 10 },
                }}
            />

            <Tabs.Screen
                name="my-appointments"
                options={{
                    title: 'Agendamentos',
                    href: isBarber ? null : undefined,
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                    tabBarBadge: !isBarber && clientPendingCount > 0 ? clientPendingCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: C.primary, color: C.bgSurface, fontSize: 10 },
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
