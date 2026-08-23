import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsEmail,
  Min,
  IsInt
  ,IsBoolean,
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

  // Meta Conversions API fields (optional)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fbp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fbc?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientUserAgent?: string;
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

  // Meta Conversions API fields (optional)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fbp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fbc?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientUserAgent?: string;
}

// ─── Admin Custom Order Item ──────────────────────────────────────────────────
export class AdminCustomOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Custom price override (admin sets this manually)' })
  @IsNumber()
  @Min(0)
  customPrice: number;

  @ApiProperty({ required: false, description: 'Product name snapshot (in case product changes)' })
  @IsOptional()
  @IsString()
  productName?: string;
}

// ─── Admin Custom Order ───────────────────────────────────────────────────────
export class CreateAdminCustomOrderDto {
  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Customer phone' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Delivery address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ description: 'Shipping charge', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCharge?: number;

  @ApiProperty({ type: [AdminCustomOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminCustomOrderItemDto)
  items: AdminCustomOrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Skip stock decrement if true' })
  @IsOptional()
  @IsBoolean()
  skipStockUpdate?: boolean;
}

export class UpdateOrderStatusDto {
  @ApiProperty()
  @IsString()
  status: string;
}
