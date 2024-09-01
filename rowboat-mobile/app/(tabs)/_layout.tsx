import { Tabs } from 'expo-router';

import messaging, { getToken } from '@react-native-firebase/messaging'
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchLastUpdated, fetchWeeks, registerToken } from '@/api/Api';
import { lastUpdatedAtom, offDaySymbolAtom, weeksAtom } from '@/api/ScheduleStore';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, PermissionsAndroid } from 'react-native';

export const defaultAppMessaging = messaging();

export default function TabLayout() {
  const setOffDaySymbol = useSetAtom(offDaySymbolAtom);
  const setLastUpdated = useSetAtom(lastUpdatedAtom);
  const colorScheme = useColorScheme();

  const setWeeks = useSetAtom(weeksAtom);

  useEffect(() => {
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

    async function sendToken() {
      const token = await getToken(defaultAppMessaging);
      registerToken(token);
    }
    sendToken();

    async function initWeeks() {
      const fetchedWeeks = await fetchWeeks();
      setWeeks(() => fetchedWeeks);
    }
    initWeeks();

    async function updateStatus() {
      const lastUpdated = await fetchLastUpdated();
      setLastUpdated(() => lastUpdated);
    }
    updateStatus();
  
    async function initOffDaySymbolValue() {
      try {
        const value = await AsyncStorage.getItem('offDaySymbol');
        if (value !== null) {
          setOffDaySymbol((symbol) => symbol = value);
        }
      } catch (error) {
        console.info("No off-day symbol saved, using default...");
      }
    }
    initOffDaySymbolValue();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if(remoteMessage.notification?.title && remoteMessage.notification.body) {
        Alert.alert(remoteMessage.notification?.title, remoteMessage.notification.body);
        updateStatus();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'reload-circle-sharp' : 'reload-circle-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'options' : 'options-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
 