// Service API REST pour le chat - MeedNess React Native (Version Finale)

import apiClient from './client';
import { CHAT_ENDPOINTS } from '../../config/env';
import type { ChatRoom, ChatMessage, CreateRoomData, MessageSender } from '../../types/chat';

export interface SearchUserResult {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string | null;
  is_blocked?: boolean;
}

export const chatAPI = {
  async getRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get(CHAT_ENDPOINTS.ROOMS);
    return response.data;
  },

  async createRoom(data: CreateRoomData): Promise<ChatRoom> {
    const response = await apiClient.post(CHAT_ENDPOINTS.ROOMS, data);
    return response.data;
  },

  async getRoomDetail(roomId: string): Promise<ChatRoom> {
    const response = await apiClient.get(CHAT_ENDPOINTS.ROOM_DETAIL(roomId));
    return response.data;
  },

  async getMessages(roomId: string, page: number = 1, limit: number = 50): Promise<{
    results: ChatMessage[];
    count: number;
    next: string | null;
  }> {
    const response = await apiClient.get(CHAT_ENDPOINTS.MESSAGES(roomId), {
      params: { page, limit },
    });
    return response.data;
  },

  async sendMessage(roomId: string, content: string, messageType: string = 'text'): Promise<ChatMessage> {
    const response = await apiClient.post(CHAT_ENDPOINTS.MESSAGES(roomId), {
      content,
      message_type: messageType,
    });
    return response.data;
  },

  async markRoomAsRead(roomId: string): Promise<void> {
    await apiClient.post(CHAT_ENDPOINTS.MARK_READ(roomId));
  },

  async getDirectRoom(userId: string): Promise<ChatRoom> {
    const response = await apiClient.get(CHAT_ENDPOINTS.DIRECT(userId));
    return response.data;
  },

  async searchUsers(query: string): Promise<SearchUserResult[]> {
    const response = await apiClient.get(CHAT_ENDPOINTS.USERS_SEARCH, {
      params: { q: query },
    });
    return response.data;
  },

  async blockUser(userId: string): Promise<void> {
    await apiClient.post(CHAT_ENDPOINTS.BLOCK_USER(userId));
  },

  async unblockUser(userId: string): Promise<void> {
    await apiClient.delete(CHAT_ENDPOINTS.BLOCK_USER(userId));
  },
};
