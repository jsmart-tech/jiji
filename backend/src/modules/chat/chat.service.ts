import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessageType, NotificationType } from '@prisma/client';
import { SendMessageDto } from './dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Room Management ─────────────────────────────────────

  async getOrCreateRoom(listingId: string, buyerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId === buyerId) throw new ForbiddenException('Cannot chat with yourself');

    const existing = await this.prisma.chatRoom.findUnique({
      where: { listingId_buyerId: { listingId, buyerId } },
      include: {
        listing: { select: { id: true, title: true, media: { where: { isCover: true }, take: 1 } } },
        buyer: { select: { id: true, firstName: true, avatarUrl: true } },
        seller: { select: { id: true, firstName: true, avatarUrl: true } },
      },
    });

    if (existing) return existing;

    return this.prisma.chatRoom.create({
      data: { listingId, buyerId, sellerId: listing.sellerId },
      include: {
        listing: { select: { id: true, title: true, media: { where: { isCover: true }, take: 1 } } },
        buyer: { select: { id: true, firstName: true, avatarUrl: true } },
        seller: { select: { id: true, firstName: true, avatarUrl: true } },
      },
    });
  }

  async getUserRooms(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.chatRoom.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        skip,
        take: limit,
        orderBy: { lastMsgAt: 'desc' },
        include: {
          listing: { select: { id: true, title: true, media: { where: { isCover: true }, take: 1 } } },
          buyer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { content: true, type: true, createdAt: true } },
        },
      }),
      this.prisma.chatRoom.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }] } }),
    ]);
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async getUserRoomIds(userId: string): Promise<string[]> {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: 'ACTIVE' },
      select: { id: true },
    });
    return rooms.map((r) => r.id);
  }

  async getRoom(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        listing: { select: { id: true, title: true, slug: true, media: { where: { isCover: true }, take: 1 } } },
        buyer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    if (!room) throw new NotFoundException('Chat room not found');
    if (room.buyerId !== userId && room.sellerId !== userId) throw new ForbiddenException('Access denied');
    return room;
  }

  // ─── Messages ─────────────────────────────────────────────

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.buyerId !== senderId && room.sellerId !== senderId) throw new ForbiddenException('Not a participant');

    const message = await this.prisma.message.create({
      data: {
        roomId: dto.roomId,
        senderId,
        type: dto.type ?? MessageType.TEXT,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        metadata: dto.metadata as object | undefined,
      },
      include: {
        sender: { select: { id: true, firstName: true, avatarUrl: true } },
      },
    });

    // Update room metadata
    const isReceiverBuyer = room.sellerId === senderId;
    await this.prisma.chatRoom.update({
      where: { id: dto.roomId },
      data: {
        lastMsgAt: new Date(),
        unreadBuyer: isReceiverBuyer ? { increment: 1 } : 0,
        unreadSeller: !isReceiverBuyer ? { increment: 1 } : 0,
      },
    });

    return message;
  }

  async getRoomMessages(roomId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { roomId, isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, firstName: true, avatarUrl: true } } },
      }),
      this.prisma.message.count({ where: { roomId, isDeleted: false } }),
    ]);
    return { data: data.reverse(), total, page, lastPage: Math.ceil(total / limit) };
  }

  async markMessagesRead(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) return;

    await this.prisma.message.updateMany({
      where: { roomId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    const isBuyer = room.buyerId === userId;
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { unreadBuyer: isBuyer ? 0 : undefined, unreadSeller: !isBuyer ? 0 : undefined },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Cannot delete another user\'s message');

    return this.prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, content: null } });
  }

  async notifyOfflineUsers(
    roomId: string,
    senderId: string,
    message: { type?: MessageType; content?: string | null },
  ): Promise<void> {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) return;

    const recipientId = room.buyerId === senderId ? room.sellerId : room.buyerId;

    // Skip the notification if the recipient has an active socket connection —
    // they'll see the message arrive live instead.
    const isOnline = await this.redis.exists(`online:${recipientId}`);
    if (isOnline) return;

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { firstName: true },
    });

    await this.notifications.create(recipientId, {
      type: NotificationType.NEW_MESSAGE,
      title: `New message from ${sender?.firstName ?? 'a buyer'}`,
      body: message.type && message.type !== MessageType.TEXT ? 'Sent an attachment' : (message.content ?? 'Sent a message'),
      data: { roomId },
    });

    // NOTE: this creates an in-app notification record only. Wiring a push
    // provider (FCM/APNs) is a separate integration — see User.fcmToken —
    // and isn't configured in this environment (no credentials in .env.example).
  }
}
