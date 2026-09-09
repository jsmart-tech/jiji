import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:8081');

  // ─── Security Middleware ─────────────────────────────────────
  app.use(helmet.default());
  app.use(compression());
  app.use(cookieParser());

  // ─── CORS ───────────────────────────────────────────────────
  app.enableCors({
    origin: [frontendUrl, /^http:\/\/localhost:\d+$/],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
  });

  // ─── API Prefix ─────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ─── Versioning ─────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI });

  // ─── Global Validation Pipe ──────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Swagger Documentation ───────────────────────────────────
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Jiji Classifieds API')
      .setDescription('Cross-platform classifieds marketplace REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User profile management')
      .addTag('listings', 'Product listings')
      .addTag('categories', 'Category management')
      .addTag('chat', 'Real-time messaging')
      .addTag('search', 'Full-text search')
      .addTag('media', 'File uploads')
      .addTag('notifications', 'Push notifications')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Jiji API running on http://0.0.0.0:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs: http://0.0.0.0:${port}/docs`);
}

bootstrap();
