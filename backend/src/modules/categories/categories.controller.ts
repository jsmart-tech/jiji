import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get full category tree' })
  getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug with attributes' })
  getCategory(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryBySlug(slug);
  }
}
