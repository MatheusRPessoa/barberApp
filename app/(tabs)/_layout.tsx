import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
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
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
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
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                }}
            />
            {/* Telas que não aparecem no tab bar */}
            <Tabs.Screen name="index"       options={{ href: null }} />
            <Tabs.Screen name="login"       options={{ href: null }} />
            <Tabs.Screen name="register"    options={{ href: null }} />
            <Tabs.Screen name="client-home" options={{ href: null }} />
            <Tabs.Screen name="changePass"  options={{ href: null }} />
            <Tabs.Screen name="sobre"       options={{ href: null }} />
        </Tabs>
    );
}
