import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { api } from '@/services/api';
import { useNotificationsContext } from '@/context/NotificationsContext';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert:  true,
        shouldPlaySound:  true,
        shouldSetBadge:   true,
        shouldShowBanner: true,
        shouldShowList:   true,
    }),
});
async function registerPushToken() {
    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } = existing === 'granted'
        ? { status: existing }
        : await Notifications.requestPermissionsAsync();

    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name:       'default',
            importance: Notifications.AndroidImportance.MAX,
            sound:      'default',
        });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
        ?? Constants.easConfig?.projectId;

    if (!projectId) {
        console.warn('projectId não encontrado — configure no app.json ou eas.json');
        return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await api.post('/users/push-token', { TOKEN: token });
}

export function useNotifications(enabled: boolean) {
    const { addNotification } = useNotificationsContext();
    const notifListener    = useRef<Notifications.EventSubscription | undefined>(undefined);
    const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

    useEffect(() => {
        if (!enabled) return;

        registerPushToken();

        notifListener.current = Notifications.addNotificationReceivedListener(notification => {
            addNotification({                                // ← substituir o console.log
                title: notification.request.content.title ?? 'BarberApp',
                body:  notification.request.content.body  ?? '',
                data:  notification.request.content.data as Record<string, unknown>,
            });
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Usuário tocou na notificação:', response);
        });

        return () => {
            notifListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [enabled]);
}
