import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: 'REDIS_CONFIG',
      useFactory: (configService: ConfigService) => ({
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        password: configService.get('redis.password'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
