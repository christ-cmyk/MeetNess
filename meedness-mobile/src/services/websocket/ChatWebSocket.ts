// Service WebSocket pour le chat temps réel - MeedNess React Native (Version Finale)

import { WS_BASE_URL } from '../../config/env';
import type { ChatMessage, TypingIndicator, WebSocketMessage } from '../../types/chat';

type MessageCallback = (message: ChatMessage) => void;
type TypingCallback = (indicator: TypingIndicator) => void;
type StatusCallback = () => void;
type ErrorCallback = (error: string) => void;
type DeletedCallback = (messageId: string, deletedBy: string) => void;
type ReactionCallback = (messageId: string, emoji: string, userId: string, username?: string) => void;
type UserStatusCallback = (userId: string, username: string) => void;
type ReadCallback = (userId: string, roomId: string) => void;

export class ChatWebSocket {
  private socket: WebSocket | null = null;
  private roomId: string = '';
  private token: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  // Callbacks
  public onMessage: MessageCallback | null = null;
  public onTyping: TypingCallback | null = null;
  public onConnect: StatusCallback | null = null;
  public onDisconnect: StatusCallback | null = null;
  public onError: ErrorCallback | null = null;
  public onDeleted: DeletedCallback | null = null;
  public onReactionAdded: ReactionCallback | null = null;
  public onReactionRemoved: ReactionCallback | null = null;
  public onUserOnline: UserStatusCallback | null = null;
  public onUserOffline: UserStatusCallback | null = null;
  public onRead: ReadCallback | null = null;

  connect(roomId: string, token: string): void {
    this.roomId = roomId;
    this.token = token;
    this.reconnectAttempts = 0;
    this.openConnection();
  }

  private openConnection(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.close();
    }

    const url = `${WS_BASE_URL}/chat/${this.roomId}/?token=${this.token}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log(`[WS] Connecté au salon ${this.roomId}`);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.startPing();
      this.onConnect?.();
    };

    this.socket.onmessage = (event: WebSocketMessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'message':
            if (data.message) this.onMessage?.(data.message);
            break;

          case 'typing':
            if (data.user_id && data.username !== undefined) {
              this.onTyping?.({
                user_id: data.user_id,
                username: data.username!,
                is_typing: data.is_typing ?? false,
              });
            }
            break;

          case 'read':
            if (data.user_id && data.room_id) {
              this.onRead?.(data.user_id, data.room_id);
            }
            break;

          case 'message_deleted':
            if (data.message_id && data.deleted_by) {
              this.onDeleted?.(data.message_id, data.deleted_by);
            }
            break;

          case 'reaction_added':
            if (data.message_id && data.emoji && data.user_id) {
              this.onReactionAdded?.(data.message_id, data.emoji, data.user_id, data.username);
            }
            break;

          case 'reaction_removed':
            if (data.message_id && data.emoji && data.user_id) {
              this.onReactionRemoved?.(data.message_id, data.emoji, data.user_id);
            }
            break;

          case 'user_online':
            if (data.user_id && data.username) {
              this.onUserOnline?.(data.user_id, data.username);
            }
            break;

          case 'user_offline':
            if (data.user_id && data.username) {
              this.onUserOffline?.(data.user_id, data.username);
            }
            break;

          case 'error':
            this.onError?.(data.error || 'Erreur WebSocket inconnue');
            break;
        }
      } catch (err) {
        console.error('[WS] Erreur parsing message:', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`[WS] Déconnecté (code: ${event.code})`);
      this.stopPing();
      this.onDisconnect?.();

      if (event.code !== 1000) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = () => {
      console.error('[WS] Erreur de connexion');
      this.onError?.('Erreur de connexion WebSocket');
    };
  }

  disconnect(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close(1000, 'Déconnexion volontaire');
      this.socket = null;
    }
  }

  sendMessage(content: string, messageType: string = 'text', replyToId?: string): void {
    const payload: Record<string, any> = {
      type: 'send_message',
      content,
      message_type: messageType,
    };
    if (replyToId) payload.reply_to_id = replyToId;
    this.send(payload);
  }

  sendTyping(isTyping: boolean): void {
    this.send({ type: 'typing', is_typing: isTyping });
  }

  markRead(messageId: string): void {
    this.send({ type: 'mark_read', message_id: messageId });
  }

  deleteMessage(messageId: string): void {
    this.send({ type: 'delete_message', message_id: messageId });
  }

  addReaction(messageId: string, emoji: string): void {
    this.send({ type: 'add_reaction', message_id: messageId, emoji });
  }

  removeReaction(messageId: string, emoji: string): void {
    this.send({ type: 'remove_reaction', message_id: messageId, emoji });
  }

  private send(data: Record<string, any>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Tentative d\'envoi sans connexion active');
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Nombre max de tentatives de reconnexion atteint');
      this.onError?.('Impossible de se reconnecter au chat');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WS] Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.openConnection();
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Instance singleton
export const chatWebSocket = new ChatWebSocket();
