// Store Zustand pour le chat temps réel - MeedNess React Native (Version Finale)

import { create } from 'zustand';
import { chatAPI } from '../../services/api/chat.api';
import type { SearchUserResult } from '../../services/api/chat.api';
import { chatWebSocket } from '../../services/websocket/ChatWebSocket';
import { storageService } from '../../services/storage/AsyncStorageService';
import { STORAGE_KEYS } from '../../config/env';
import type { ChatRoom, ChatMessage, CreateRoomData, TypingIndicator } from '../../types/chat';

interface ChatState {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, TypingIndicator[]>;
  onlineUsers: Record<string, boolean>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  hasMoreMessages: Record<string, boolean>;
}

interface ChatActions {
  fetchRooms: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<ChatRoom>;
  setActiveRoom: (room: ChatRoom | null) => void;
  connectToRoom: (roomId: string) => Promise<void>;
  disconnectFromRoom: () => void;
  sendMessage: (content: string, replyToId?: string) => void;
  loadMessages: (roomId: string, page?: number) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, changes: Partial<ChatMessage>) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  setTyping: (isTyping: boolean) => void;
  markAsRead: (roomId: string) => Promise<void>;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  searchUsers: (query: string) => Promise<SearchUserResult[]>;
  getOrCreateDirectRoom: (userId: string) => Promise<ChatRoom>;
  getTotalUnread: () => number;
  clearChat: () => void;
  clearError: () => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: {},
  typingUsers: {},
  onlineUsers: {},
  isConnected: false,
  isLoading: false,
  error: null,
  hasMoreMessages: {},

  fetchRooms: async () => {
    try {
      set({ isLoading: true, error: null });
      const rooms = await chatAPI.getRooms();
      set({ rooms, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur de chargement des salons';
      set({ error: message, isLoading: false });
    }
  },

  createRoom: async (data: CreateRoomData) => {
    try {
      set({ isLoading: true, error: null });
      const room = await chatAPI.createRoom(data);
      set((state) => ({ rooms: [room, ...state.rooms], isLoading: false }));
      return room;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur de création du salon';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  setActiveRoom: (room: ChatRoom | null) => set({ activeRoom: room }),

  connectToRoom: async (roomId: string) => {
    try {
      const token = await storageService.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) throw new Error('Token non disponible');

      // Message callback
      chatWebSocket.onMessage = (message: ChatMessage) => {
        const state = get();
        const roomMessages = state.messages[roomId] || [];
        if (!roomMessages.find((m) => m.id === message.id)) {
          set({
            messages: { ...state.messages, [roomId]: [...roomMessages, message] },
          });
        }
        // Update last_message on room
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? { ...r, last_message: message, unread_count: s.activeRoom?.id === roomId ? 0 : r.unread_count + 1 }
              : r
          ),
        }));
      };

      // Typing callback
      chatWebSocket.onTyping = (indicator: TypingIndicator) => {
        const state = get();
        const roomTyping = state.typingUsers[roomId] || [];
        if (indicator.is_typing) {
          if (!roomTyping.find((t) => t.user_id === indicator.user_id)) {
            set({ typingUsers: { ...state.typingUsers, [roomId]: [...roomTyping, indicator] } });
          }
        } else {
          set({ typingUsers: { ...state.typingUsers, [roomId]: roomTyping.filter((t) => t.user_id !== indicator.user_id) } });
        }
      };

      // Deleted callback
      chatWebSocket.onDeleted = (messageId: string) => {
        const state = get();
        const roomMessages = state.messages[roomId] || [];
        set({
          messages: {
            ...state.messages,
            [roomId]: roomMessages.map((m) =>
              m.id === messageId ? { ...m, is_deleted: true, content: 'Ce message a été supprimé.' } : m
            ),
          },
        });
      };

      // Reaction added callback
      chatWebSocket.onReactionAdded = (messageId: string, emoji: string, userId: string, username?: string) => {
        const state = get();
        const roomMessages = state.messages[roomId] || [];
        set({
          messages: {
            ...state.messages,
            [roomId]: roomMessages.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    reactions: [
                      ...m.reactions,
                      { id: `${messageId}-${emoji}-${userId}`, emoji, user: { id: userId, username: username || '' }, created_at: new Date().toISOString() },
                    ],
                  }
                : m
            ),
          },
        });
      };

      // Reaction removed callback
      chatWebSocket.onReactionRemoved = (messageId: string, emoji: string, userId: string) => {
        const state = get();
        const roomMessages = state.messages[roomId] || [];
        set({
          messages: {
            ...state.messages,
            [roomId]: roomMessages.map((m) =>
              m.id === messageId
                ? { ...m, reactions: m.reactions.filter((r) => !(r.emoji === emoji && r.user.id === userId)) }
                : m
            ),
          },
        });
      };

      // Online/offline callbacks
      chatWebSocket.onUserOnline = (userId: string) => {
        set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: true } }));
      };

      chatWebSocket.onUserOffline = (userId: string) => {
        set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: false } }));
      };

      chatWebSocket.onConnect = () => set({ isConnected: true });
      chatWebSocket.onDisconnect = () => set({ isConnected: false });
      chatWebSocket.onError = (error: string) => set({ error });

      chatWebSocket.connect(roomId, token);
    } catch (error: any) {
      set({ error: error.message || 'Erreur de connexion WebSocket' });
    }
  },

  disconnectFromRoom: () => {
    chatWebSocket.disconnect();
    set({ isConnected: false, activeRoom: null });
  },

  sendMessage: (content: string, replyToId?: string) => {
    chatWebSocket.sendMessage(content, 'text', replyToId);
  },

  loadMessages: async (roomId: string, page: number = 1) => {
    try {
      set({ isLoading: true, error: null });
      const data = await chatAPI.getMessages(roomId, page);
      const existingMessages = get().messages[roomId] || [];

      set({
        messages: {
          ...get().messages,
          [roomId]: page === 1
            ? data.results.reverse()
            : [...data.results.reverse(), ...existingMessages],
        },
        hasMoreMessages: { ...get().hasMoreMessages, [roomId]: data.next !== null },
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur de chargement des messages';
      set({ error: message, isLoading: false });
    }
  },

  addMessage: (message: ChatMessage) => {
    const state = get();
    const roomMessages = state.messages[message.room_id] || [];
    if (!roomMessages.find((m) => m.id === message.id)) {
      set({ messages: { ...state.messages, [message.room_id]: [...roomMessages, message] } });
    }
  },

  updateMessage: (messageId: string, changes: Partial<ChatMessage>) => {
    const state = get();
    const newMessages: Record<string, ChatMessage[]> = {};
    for (const [rId, msgs] of Object.entries(state.messages)) {
      newMessages[rId] = msgs.map((m) => (m.id === messageId ? { ...m, ...changes } : m));
    }
    set({ messages: newMessages });
  },

  deleteMessage: (messageId: string) => {
    chatWebSocket.deleteMessage(messageId);
  },

  addReaction: (messageId: string, emoji: string) => {
    chatWebSocket.addReaction(messageId, emoji);
  },

  removeReaction: (messageId: string, emoji: string) => {
    chatWebSocket.removeReaction(messageId, emoji);
  },

  setTyping: (isTyping: boolean) => {
    chatWebSocket.sendTyping(isTyping);
  },

  markAsRead: async (roomId: string) => {
    try {
      await chatAPI.markRoomAsRead(roomId);
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r)),
      }));
    } catch (error) {
      console.error('Erreur mark as read:', error);
    }
  },

  setUserOnline: (userId: string, isOnline: boolean) => {
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: isOnline } }));
  },

  searchUsers: async (query: string): Promise<SearchUserResult[]> => {
    try {
      return await chatAPI.searchUsers(query);
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error);
      return [];
    }
  },

  getOrCreateDirectRoom: async (userId: string): Promise<ChatRoom> => {
    const room = await chatAPI.getDirectRoom(userId);
    const state = get();
    if (!state.rooms.find((r) => r.id === room.id)) {
      set({ rooms: [room, ...state.rooms] });
    }
    return room;
  },

  getTotalUnread: () => {
    return get().rooms.reduce((sum, room) => sum + room.unread_count, 0);
  },

  clearChat: () => {
    chatWebSocket.disconnect();
    set({
      rooms: [],
      activeRoom: null,
      messages: {},
      typingUsers: {},
      onlineUsers: {},
      isConnected: false,
      isLoading: false,
      error: null,
      hasMoreMessages: {},
    });
  },

  clearError: () => set({ error: null }),
}));
