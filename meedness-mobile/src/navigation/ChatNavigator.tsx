// Stack Navigator pour le module Chat - MeedNess React Native (Version Finale)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/main/ChatScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { CreateRoomScreen } from '../screens/chat/CreateRoomScreen';
import { UserSearchScreen } from '../screens/chat/UserSearchScreen';

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { roomId: string; roomName: string };
  CreateRoom: undefined;
  UserSearch: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="UserSearch" component={UserSearchScreen} />
    </Stack.Navigator>
  );
}
