// Location, Reviews, Promotions, Notifications modules — stub implementations
// Each follows the same NestJS module pattern as the other modules above

// ─── Location Module ──────────────────────────────────────
export * from './location.module';

// location.module.ts
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({ controllers: [LocationController], providers: [LocationService], exports: [LocationService] })
export class LocationModule {}
