import {
  IsString, IsNumber, IsOptional, IsBoolean, IsArray,
  IsInt, Min, ValidateNested, IsHexColor,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ required: false, example: 'Black' })
  @IsOptional() @IsString()
  color?: string;

  @ApiProperty({ required: false, example: '#c9748e' })
  @IsOptional()
  @IsString()
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
  name: string;

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

  // Variants are optional on create — admin can add them after
  @ApiProperty({ required: false, type: [CreateVariantDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
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
}

export class ProductQueryDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsString()
  minPrice?: string;

  @IsOptional() @IsString()
  maxPrice?: string;

  @IsOptional() @IsString()
  sort?: string;

  @IsOptional() @IsString()
  page?: string;

  @IsOptional() @IsString()
  limit?: string;

  @IsOptional() @IsString()
  featured?: string;

  @IsOptional() @IsString()
  sale?: string;
}