// Navigateur Objectifs — MeedNess Phase 5

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalsScreen } from '../screens/main/GoalsScreen';
import { GoalDetailScreen } from '../screens/goals/GoalDetailScreen';
import { CreateGoalScreen } from '../screens/goals/CreateGoalScreen';

export type GoalsStackParamList = {
  GoalsList: undefined;
  GoalDetail: { goalId: string };
  CreateGoal: undefined;
};

const Stack = createNativeStackNavigator<GoalsStackParamList>();

export function GoalsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsList" component={GoalsScreen} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
      <Stack.Screen name="CreateGoal" component={CreateGoalScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
