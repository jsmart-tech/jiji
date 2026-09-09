import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto, SearchListingsDto, MarkSoldDto } from './dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.sub, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search and filter listings' })
  search(@Query() dto: SearchListingsDto) {
    return this.listingsService.search(dto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured/promoted listings' })
  getFeatured() {
    return this.listingsService.getFeatured();
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user saved listings' })
  getSaved(@CurrentUser() user: JwtPayload, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.listingsService.getSavedListings(user.sub, +page, +limit);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current seller listings' })
  getMyListings(@CurrentUser() user: JwtPayload, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.listingsService.findBySeller(user.sub, +page, +limit);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get listings by category' })
  getByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.listingsService.getRecentByCategory(categoryId, +page, +limit);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a single listing by ID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.listingsService.findOne(idOrSlug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, user.sub, dto);
  }

  @Patch(':id/sold')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark listing as sold' })
  markSold(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: MarkSoldDto) {
    return this.listingsService.markSold(id, user.sub, dto);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save/unsave a listing' })
  @HttpCode(HttpStatus.OK)
  toggleSave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.listingsService.toggleSave(user.sub, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a listing' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.listingsService.remove(id, user.sub);
  }
}
