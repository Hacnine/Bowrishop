import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  IsHexColor,
  MaxLength

} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ required: false, example: 'Black' })
  @IsOptional() @IsString()
  color?: string;

  @ApiProperty({ required: false, example: '#c9748e' })
  @IsOptional() @IsString()
  colorHex?: string;

  @ApiProperty({ required: false, example: 'Large' })
  @IsOptional() @IsString()
  size?: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber() @Min(0)
  price: number;

  @ApiProperty({ required: false, example: 12.99 })
  @IsOptional() @IsNumber() @Min(0)
  comparePrice?: number;

  @ApiProperty({ example: 20 })
  @IsInt() @Min(0)
  stock: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false, example: 'SKU-001-BLK-LG' })
  @IsOptional() @IsString()
  sku?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateVariantDto {
  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsHexColor()
  colorHex?: string;

  @IsOptional() @IsString()
  size?: string;

  @IsOptional() @IsNumber() @Min(0)
  price?: number;

  @IsOptional() @IsNumber() @Min(0)
  comparePrice?: number;

  @IsOptional() @IsInt() @Min(0)
  stock?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @IsOptional() @IsString()
  sku?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string; @MaxLength(255)

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber() @Min(0)
  price: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber() @Min(0)
  comparePrice?: number;

  @ApiProperty()
  @IsInt() @Min(0)
  stock: number;

  @ApiProperty({ type: [String] })
  @IsArray() @IsString({ each: true })
  images: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, type: [CreateVariantDto] })
  @IsOptional()
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

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;
  // ─── Specifications ─────────────────────────────────────────────
  @ApiProperty({ required: false, description: 'Key-value pairs e.g. { "Brand": "BMW", "Material": "Polyester" }' })
  @IsOptional()
  specifications?: Record<string, string>;
}

export class UpdateProductDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber() @Min(0)
  price?: number;

  @IsOptional() @IsNumber() @Min(0)
  comparePrice?: number;

  @IsOptional() @IsInt() @Min(0)
  stock?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  // ─── Pre-order fields ───────────────────────────────────────────
  @IsOptional() @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional() @IsString()
  preOrderNote?: string;

  @IsOptional() @IsString()
  preOrderDate?: string;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  // ─── Specifications ─────────────────────────────────────────────
  @IsOptional()
  specifications?: Record<string, string>;
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
  @IsOptional() @IsString() preOrder?: string;
  @IsOptional() @IsString() sort?: string;
}

export class AdminProductQueryDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() q?: string;
}