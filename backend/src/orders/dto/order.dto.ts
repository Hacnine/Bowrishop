import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsEmail,
  Min,
  IsInt
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ShippingAddressDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsString() address: string;
  @IsString() city: string;
  @IsString() district: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsNumber() shippingCharge?: number;
}

export class OrderItemInputDto {
  @IsString() productId: string;
  @IsOptional() @IsString() variantId?: string;
  @IsNumber() quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GuestOrderItemDto {
  @IsString() 
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string; // 👈 Add this so NestJS validation doesn't strip it!

  @IsInt() 
  @Min(1) 
  quantity: number;
}

export class CreateGuestOrderDto {
  @ApiProperty()
  @IsEmail()
  guestEmail: string;

  @ApiProperty()
  @IsString()
  guestName: string;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty()
  @IsString()
  status: string;
}
