import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected');

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error Prisma event typing
      this.$on('query', (event: { query: string; duration: number }) => {
        if (event.duration > 500) {
          this.logger.warn(`Slow query (${event.duration}ms): ${event.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Helper: Paginate a Prisma query result set.
   */
  async paginate<T>(
    model: string,
    args: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<{ data: T[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (this as any)[model];
    const [data, total] = await this.$transaction([
      delegate.findMany({ ...args, skip, take: limit }),
      delegate.count({ where: args.where }),
    ]);
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }
}
