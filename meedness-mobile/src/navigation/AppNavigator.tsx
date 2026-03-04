// Navigateur principal pour MeedNess - React Native
// Gère le flux : Auth → Rôle → Organisation → Main

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { useOrganizationStore } from '../store/stores/useOrganizationStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Écrans intermédiaires
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { CreateOrganizationScreen } from '../screens/organization/CreateOrganizationScreen';
import { WaitingInvitationScreen } from '../screens/organization/WaitingInvitationScreen';

type RootStackParamList = {
  Auth: undefined;
  RoleSelection: undefined;
  CreateOrganization: undefined;
  WaitingInvitation: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isAuthenticated, isInitialized, isLoading, needsRoleSelection, role } = useAuth();
  const { organization, fetchMyOrganization } = useOrganizationStore();

  // Charger l'organisation quand authentifié et rôle choisi
  useEffect(() => {
    if (isAuthenticated && !needsRoleSelection && role) {
      fetchMyOrganization();
    }
  }, [isAuthenticated, needsRoleSelection, role, fetchMyOrganization]);

  // Afficher un loader pendant l'initialisation
  if (!isInitialized || isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  // Déterminer l'écran initial selon l'état
  const getInitialRoute = (): keyof RootStackParamList => {
    if (!isAuthenticated) return 'Auth';
    if (needsRoleSelection) return 'RoleSelection';
    if (!organization && role === 'admin') return 'CreateOrganization';
    if (!organization && role === 'member') return 'WaitingInvitation';
    return 'Main';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsRoleSelection ? (
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        ) : !organization && role === 'admin' ? (
          <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} />
        ) : !organization && role === 'member' ? (
          <Stack.Screen name="WaitingInvitation" component={WaitingInvitationScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
