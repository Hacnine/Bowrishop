import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsString()
  colorHex?: string;

  @IsOptional() @IsString()
  size?: string;

  @IsNumber() price: number;

  @IsOptional() @IsNumber()
  comparePrice?: number;

  @IsNumber() stock: number;

  @IsOptional() @IsString()
  sku?: string;

  @IsOptional() @IsArray()
  images?: string[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateVariantDto {
  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsString()
  colorHex?: string;

  @IsOptional() @IsString()
  size?: string;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsNumber()
  comparePrice?: number;

  @IsOptional() @IsNumber()
  stock?: number;

  @IsOptional() @IsString()
  sku?: string;

  @IsOptional() @IsArray()
  images?: string[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @ApiProperty() 
  @IsString() 
  @MaxLength(80)
  name: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  description?: string;

  @ApiProperty() @IsNumber()
  price: number;

  @ApiProperty({ required: false }) @IsOptional() @IsNumber()
  comparePrice?: number;

  @ApiProperty() @IsNumber()
  stock: number;

  @ApiProperty({ required: false }) @IsOptional() @IsArray()
  images?: string[];

  @ApiProperty({ required: false }) @IsOptional() @IsArray()
  tags?: string[];

  @ApiProperty() @IsString()
  categoryId: string;

  @ApiProperty({ required: false }) @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false }) @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ required: false, type: [CreateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  // ─── Pre-order fields ───────────────────────────────────────────
  @ApiProperty({ required: false, description: 'Mark product as pre-order' })
  @IsOptional() @IsBoolean()
  isPreOrder?: boolean;

  @ApiProperty({ required: false, description: 'e.g. "Ships in 2–3 weeks"' })
  @IsOptional() @IsString()
  preOrderNote?: string;

  @ApiProperty({ required: false, description: 'Expected availability date (ISO string)' })
  @IsOptional() @IsString()
  preOrderDate?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsNumber()
  comparePrice?: number;

  @IsOptional() @IsNumber()
  stock?: number;

  @IsOptional() @IsArray()
  images?: string[];

  @IsOptional() @IsArray()
  tags?: string[];

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  // ─── Pre-order fields ───────────────────────────────────────────
  @IsOptional() @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional() @IsString()
  preOrderNote?: string;

  @IsOptional() @IsString()
  preOrderDate?: string;
}

export class ProductQueryDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() minPrice?: string;
  @IsOptional() @IsString() maxPrice?: string;
  @IsOptional() @IsString() featured?: string;
  @IsOptional() @IsString() sale?: string;
  @IsOptional() @IsString() preOrder?: string; // ?preOrder=true filter
  @IsOptional() @IsString() sort?: string;
}

export class AdminProductQueryDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() q?: string;
}