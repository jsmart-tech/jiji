import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for current user' })
  getRooms(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.chatService.getUserRooms(user.sub, +page, +limit);
  }

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Get a specific chat room' })
  getRoom(@Param('roomId') roomId: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.getRoom(roomId, user.sub);
  }

  @Post('rooms/listing/:listingId')
  @ApiOperation({ summary: 'Get or create chat room for a listing' })
  getOrCreateRoom(@Param('listingId') listingId: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.getOrCreateRoom(listingId, user.sub);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get messages in a chat room' })
  getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getRoomMessages(roomId, +page, +limit);
  }

  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark messages in room as read' })
  markRead(@Param('roomId') roomId: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.markMessagesRead(roomId, user.sub);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  deleteMessage(@Param('messageId') messageId: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.deleteMessage(messageId, user.sub);
  }
}
