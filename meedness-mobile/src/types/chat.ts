// Types pour le chat en temps réel - MeedNess React Native (Version Finale)

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'system';
export type RoomType = 'general' | 'team' | 'announcement' | 'direct';

export interface MessageSender {
  id: string;
  username: string;
  avatar?: string | null;
  full_name?: string;
}

export interface MessageMedia {
  id: string;
  media_type: 'image' | 'file' | 'audio';
  file_url: string;
  filename: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user: MessageSender;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  content: string;
  sender: MessageSender;
  message_type: MessageType;
  reply_to?: {
    id: string;
    content: string;
    sender: MessageSender;
  } | null;
  media: MessageMedia[];
  reactions: MessageReaction[];
  is_read: boolean;
  is_deleted: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  organization_id?: string;
  team_id?: string;
  last_message?: Partial<ChatMessage> | null;
  unread_count: number;
  members_count: number;
  members?: ChatRoomMember[];
  created_at: string;
  updated_at: string;
}

export interface ChatRoomMember {
  id: string;
  user: MessageSender;
  role: 'admin' | 'member';
  last_read_at: string;
  joined_at: string;
}

export interface CreateRoomData {
  name: string;
  type: RoomType;
  organization_id?: string;
  team_id?: string;
  member_ids?: string[];
}

export interface TypingIndicator {
  user_id: string;
  username: string;
  is_typing: boolean;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'message_deleted' | 'reaction_added' | 'reaction_removed' | 'user_online' | 'user_offline' | 'error';
  message?: ChatMessage;
  user_id?: string;
  username?: string;
  is_typing?: boolean;
  message_id?: string;
  emoji?: string;
  deleted_by?: string;
  room_id?: string;
  error?: string;
}
