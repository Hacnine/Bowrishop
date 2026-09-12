import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  AdminProductQueryDto, CreateProductDto, UpdateProductDto, ProductQueryDto,
  CreateVariantDto, UpdateVariantDto, RemoveProductImageDto,
} from './dto/product.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    return this.productsService.getFeatured(limit ? parseInt(limit) : 8);
  }

  @Get('best-selling')
  getBestSelling(@Query('limit') limit?: string) {
    return this.productsService.getBestSelling(limit ? parseInt(limit) : 10);
  }

  @Get('on-sale')
  getOnSale(@Query('limit') limit?: string) {
    return this.productsService.getOnSale(limit ? parseInt(limit) : 10);
  }

  @Get('new-arrivals')
  getNewArrivals(@Query('limit') limit?: string) {
    return this.productsService.getNewArrivals(limit ? parseInt(limit) : 10);
  }

  @Get('most-viewed')
  getMostViewed(@Query('limit') limit?: string) {
    return this.productsService.getMostViewed(limit ? parseInt(limit) : 10);
  }

  @Get('admin/search')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  searchAdminProducts(@Query() query: AdminProductQueryDto) {
    return this.productsService.searchAdminProducts(query);
  }


  @Get(':id/related')
  getRelated(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getRelated(id, limit ? parseInt(limit) : 20);
  }

  // ─── Admin: Variant CRUD ───────────────────────────────────────────────────
  // Routes:
  //   GET    /products/:id/variants         → list all variants for a product
  //   POST   /products/:id/variants         → add a new variant
  //   PATCH  /products/:id/variants/:vid    → update a variant
  //   DELETE /products/:id/variants/:vid    → delete a variant
  //
  // NOTE: All `:id/...` sub-resource routes MUST appear before `@Get(':slug')`
  // or NestJS will swallow them into findBySlug, returning 404 + 401 pairs.

  @Get(':id/variants')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  getVariants(@Param('id') id: string) {
    return this.productsService.getVariants(id);
  }

  // ─── Public: single product by slug (must be last among GET :param routes) ─

  @Get(':slug')
  findOne(
    @Param('slug') slug: string,
    @Headers('x-session-id') sessionId?: string,
  ) {
    return this.productsService.findBySlug(slug, sessionId);
  }

  // ─── Admin: Product CRUD ───────────────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id/images')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  removeImage(@Param('id') id: string, @Body() dto: RemoveProductImageDto) {
    return this.productsService.removeImage(id, dto.url);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/variants')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  createVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.createVariant(id, dto);
  }

  @Patch(':id/variants/:vid')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  updateVariant(@Param('vid') vid: string, @Body() dto: UpdateVariantDto) {
    return this.productsService.updateVariant(vid, dto);
  }

  @Delete(':id/variants/:vid')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  deleteVariant(@Param('vid') vid: string) {
    return this.productsService.deleteVariant(vid);
  }
}
