import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async getCountries() {
    return this.redis.getOrSet('locations:countries', () => this.prisma.country.findMany({ include: { _count: { select: { states: true } } } }), 86400);
  }

  async getStates(countryId: string) {
    return this.redis.getOrSet(`locations:states:${countryId}`, () =>
      this.prisma.state.findMany({ where: { countryId }, orderBy: { name: 'asc' }, include: { _count: { select: { lgas: true } } } }), 86400);
  }

  async getLgas(stateId: string) {
    return this.redis.getOrSet(`locations:lgas:${stateId}`, () =>
      this.prisma.lga.findMany({ where: { stateId }, orderBy: { name: 'asc' }, include: { _count: { select: { cities: true } } } }), 86400);
  }

  async getCities(lgaId: string) {
    return this.redis.getOrSet(`locations:cities:${lgaId}`, () =>
      this.prisma.city.findMany({ where: { lgaId }, orderBy: { name: 'asc' } }), 86400);
  }
}
