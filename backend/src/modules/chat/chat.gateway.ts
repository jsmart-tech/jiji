import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { RedisService } from '../../common/redis/redis.service';
import { SendMessageDto, TypingDto, JoinRoomDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRooms: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'chat',
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // Map of userId -> Set of socket IDs
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('✅ Chat WebSocket Gateway initialized');
  }

  // ─── Connection Lifecycle ─────────────────────────────────

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.configService.get('jwt.accessSecret'),
      });

      client.userId = payload.sub;
      client.userRooms = new Set();

      // Track connected sockets
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      // Mark user as online in Redis
      await this.redis.set(`online:${payload.sub}`, '1', 120); // 2-min TTL

      // Rejoin user's chat rooms
      const rooms = await this.chatService.getUserRoomIds(payload.sub);
      for (const roomId of rooms) {
        void client.join(roomId);
        client.userRooms.add(roomId);
      }

      // Broadcast online status
      this.broadcastOnlineStatus(payload.sub, true);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;

    const sockets = this.userSockets.get(client.userId);
    sockets?.delete(client.id);

    if (!sockets || sockets.size === 0) {
      this.userSockets.delete(client.userId);
      await this.redis.del(`online:${client.userId}`);
      await this.redis.del(`typing:${client.userId}`);
      this.broadcastOnlineStatus(client.userId, false);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Events ───────────────────────────────────────────────

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const room = await this.chatService.getOrCreateRoom(dto.listingId, client.userId);
    void client.join(room.id);
    client.userRooms.add(room.id);

    // Send last 50 messages on join
    const history = await this.chatService.getRoomMessages(room.id, 1, 50);
    client.emit('room_joined', { room, messages: history });
    return room;
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    if (!client.userId) throw new WsException('Unauthorized');

    const message = await this.chatService.sendMessage(client.userId, dto);

    // Broadcast to room (including sender for confirmation)
    this.server.to(dto.roomId).emit('new_message', message);

    // Send push notification to offline users in the room
    await this.chatService.notifyOfflineUsers(dto.roomId, client.userId, message);

    return message;
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: TypingDto,
  ) {
    await this.redis.set(`typing:${client.userId}:${dto.roomId}`, '1', 5);
    client.to(dto.roomId).emit('user_typing', { userId: client.userId, roomId: dto.roomId });
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: TypingDto,
  ) {
    await this.redis.del(`typing:${client.userId}:${dto.roomId}`);
    client.to(dto.roomId).emit('user_stopped_typing', { userId: client.userId, roomId: dto.roomId });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    await this.chatService.markMessagesRead(data.roomId, client.userId);
    client.to(data.roomId).emit('messages_read', { roomId: data.roomId, userId: client.userId });
  }

  @SubscribeMessage('check_online')
  async handleCheckOnline(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: string },
  ) {
    const isOnline = await this.redis.exists(`online:${data.userId}`);
    client.emit('online_status', { userId: data.userId, isOnline });
  }

  // ─── Helpers ─────────────────────────────────────────────

  private broadcastOnlineStatus(userId: string, isOnline: boolean) {
    this.server.emit('online_status', { userId, isOnline });
  }

  /**
   * Emit an event to a specific user (across all their devices/tabs)
   */
  emitToUser(userId: string, event: string, data: unknown) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
