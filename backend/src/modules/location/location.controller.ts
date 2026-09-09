import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('countries') getCountries() { return this.locationService.getCountries(); }
  @Get('countries/:countryId/states') getStates(@Param('countryId') id: string) { return this.locationService.getStates(id); }
  @Get('states/:stateId/lgas') getLgas(@Param('stateId') id: string) { return this.locationService.getLgas(id); }
  @Get('lgas/:lgaId/cities') getCities(@Param('lgaId') id: string) { return this.locationService.getCities(id); }
}
