import {
  IsString, IsOptional, IsNumber, IsArray, IsBoolean, Min,
  IsPositive, IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  comparePrice?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number) price?: number;
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number) comparePrice?: number;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) stock?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ProductQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() minPrice?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() maxPrice?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() minRating?: number;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() inStock?: boolean;
  @IsOptional() @IsString() sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) limit?: number = 12;
}
