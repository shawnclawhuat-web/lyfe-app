import { ROLE_TABS, type UserRole } from '@/constants/Roles';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  leads: 'people-outline',
  exams: 'school-outline',
  team: 'briefcase-outline',
  pa: 'clipboard-outline',
  admin: 'settings-outline',
  profile: 'person-outline',
};

const TAB_ICONS_FOCUSED: Record<string, keyof typeof Ionicons.glyphMap> = {
  leads: 'people',
  exams: 'school',
  team: 'briefcase',
  pa: 'clipboard',
  admin: 'settings',
  profile: 'person',
};

const TAB_LABELS: Record<string, string> = {
  leads: 'Leads',
  exams: 'Exams',
  team: 'Team',
  pa: 'PA',
  admin: 'Admin',
  profile: 'Profile',
};

export default function TabLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const role: UserRole = user?.role || 'agent';
  const visibleTabs = ROLE_TABS[role] || ['profile'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          elevation: 0,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="leads"
        options={{
          title: TAB_LABELS.leads,
          href: visibleTabs.includes('leads') ? '/leads' : null,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? TAB_ICONS_FOCUSED.leads : TAB_ICONS.leads}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: TAB_LABELS.exams,
          href: visibleTabs.includes('exams') ? '/exams' : null,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? TAB_ICONS_FOCUSED.exams : TAB_ICONS.exams}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: TAB_LABELS.team,
          href: visibleTabs.includes('team') ? '/team' : null,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? TAB_ICONS_FOCUSED.team : TAB_ICONS.team}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pa"
        options={{
          title: TAB_LABELS.pa,
          href: visibleTabs.includes('pa') ? '/pa' : null,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? TAB_ICONS_FOCUSED.pa : TAB_ICONS.pa}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: TAB_LABELS.admin,
          href: visibleTabs.includes('admin') ? '/admin' : null,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? TAB_ICONS_FOCUSED.admin : TAB_ICONS.admin}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_LABELS.profile,
          href: '/profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? TAB_ICONS_FOCUSED.profile : TAB_ICONS.profile}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
