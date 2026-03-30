// Navigateur Tâches — Stack Navigator — MeedNess Phase 4

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TasksScreen } from '../screens/main/TasksScreen';
import { BoardScreen } from '../screens/tasks/BoardScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { CreateTaskScreen } from '../screens/tasks/CreateTaskScreen';
import { CreateBoardScreen } from '../screens/tasks/CreateBoardScreen';

export type TasksStackParamList = {
  TasksList: undefined;
  Board: { boardId: string; boardName: string };
  TaskDetail: { taskId: string; taskTitle: string };
  CreateTask: { boardId: string; columnId?: string };
  CreateBoard: undefined;
};

const Stack = createNativeStackNavigator<TasksStackParamList>();

export function TasksNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TasksList" component={TasksScreen} />
      <Stack.Screen name="Board" component={BoardScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
      <Stack.Screen name="CreateBoard" component={CreateBoardScreen} />
    </Stack.Navigator>
  );
}
