import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Tree structure (root → subCategories nested)
   * Frontend navigation ও admin tree view এ ব্যবহার হবে
   */
  @Get()
  @ApiOperation({ summary: 'Get all categories as tree (root + nested subs)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * Flat list — সব categories একই array তে, parent info সহ
   * Product form এর categoryId dropdown এ ব্যবহার হবে
   * NOTE: /flat route টা :id এর আগে থাকতে হবে, নাহলে NestJS "flat" কে id হিসেবে parse করবে
   */
  @Get('flat')
  @ApiOperation({ summary: 'Get all categories as flat list (for dropdowns)' })
  findAllFlat() {
    return this.categoriesService.findAllFlat();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category by ID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create category (optionally with parentId for sub-category)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
