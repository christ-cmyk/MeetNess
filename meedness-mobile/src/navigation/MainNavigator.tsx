// Navigateur principal avec Bottom Tab Bar - MeedNess React Native

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import { HomeScreen } from '../screens/main/HomeScreen';
import { ChatNavigator } from './ChatNavigator';
import { TasksNavigator } from './TasksNavigator';
import { GoalsNavigator } from './GoalsNavigator';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { useChatStore } from '../store/stores/useChatStore';

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Tasks: undefined;
  Goals: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Tasks: { active: 'checkbox', inactive: 'checkbox-outline' },
  Goals: { active: 'trophy', inactive: 'trophy-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Accueil',
  Chat: 'Chat',
  Tasks: 'Tâches',
  Goals: 'Objectifs',
  Profile: 'Profil',
};

export function MainNavigator() {
  const totalUnread = useChatStore((s) => s.rooms.reduce((sum, r) => sum + r.unread_count, 0));

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = TAB_ICONS[route.name as keyof MainTabParamList];
          return (
            <Ionicons
              name={(focused ? icons.active : icons.inactive) as any}
              size={size}
              color={focused ? colors.primary[500] : colors.text.tertiary}
            />
          );
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: TAB_LABELS.Home }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{
          tabBarLabel: TAB_LABELS.Chat,
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksNavigator}
        options={{
          tabBarLabel: TAB_LABELS.Tasks,
          tabBarBadge: undefined,
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsNavigator}
        options={{ tabBarLabel: TAB_LABELS.Goals }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: TAB_LABELS.Profile }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.primary,
    borderTopColor: colors.border.light,
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#EF4444',
    fontSize: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
  },
});
