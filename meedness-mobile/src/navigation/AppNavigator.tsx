import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../hooks/useAuth';
import { useOrganizationStore } from '../store/stores/useOrganizationStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import {CreateOrganizationScreen} from '../screens/organization/CreateOrganizationScreen';
import {WaitingInvitationScreen} from '../screens/organization/WaitingInvitationScreen';

export function AppNavigator() {
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    needsRoleSelection,
    intentRole,
  } = useAuth();

  const { organization, fetchMyOrganization } = useOrganizationStore();

  useEffect(() => {
    if (isAuthenticated && !needsRoleSelection && intentRole) {
      const timer = setTimeout(() => {
        fetchMyOrganization();
      }, 300);
      return () => clearTimeout(timer);
      
    }
  }, [isAuthenticated, needsRoleSelection, intentRole]);

  // Loader pendant initialisation
  if (!isInitialized || isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  // Rendu conditionnel direct sans Stack.Navigator
  const renderScreen = () => {
    if (!isAuthenticated && !needsRoleSelection) {
      return <AuthNavigator />;
    }

    if (needsRoleSelection) {
      return <RoleSelectionScreen />;
    }

    if (isAuthenticated && !organization && intentRole === 'admin') {
      return <CreateOrganizationScreen />;
    }

    if (isAuthenticated && !organization && intentRole === 'member') {
      return <WaitingInvitationScreen />;
    }

    return <MainNavigator />;
  };

  return (
    <NavigationContainer>
      {renderScreen()}
    </NavigationContainer>
  );
}