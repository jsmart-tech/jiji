import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ChatModule } from './modules/chat/chat.module';
import { SearchModule } from './modules/search/search.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LocationModule } from './modules/location/location.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import awsConfig from './config/aws.config';
import meiliConfig from './config/meili.config';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, awsConfig, meiliConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // ─── Rate Limiting ───────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 300 },
    ]),

    // ─── Scheduler ──────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Core Infrastructure ─────────────────────────────────
    PrismaModule,
    RedisModule,

    // ─── Feature Modules ─────────────────────────────────────
    AuthModule,
    UsersModule,
    ListingsModule,
    CategoriesModule,
    ChatModule,
    SearchModule,
    MediaModule,
    NotificationsModule,
    LocationModule,
    ReviewsModule,
    PromotionsModule,
  ],
})
export class AppModule {}
