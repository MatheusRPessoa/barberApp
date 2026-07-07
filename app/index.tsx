import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Redirect href="/login" />;
    return <Redirect href={user.type === 'BARBER' ? '/home' : '/client-home'} />;
}
