import { IsString, IsOptional, IsObject, ValidateNested, IsEmail, IsInt, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ShippingAddressDto {
  @IsString() fullName: string;
  @IsString() streetAddress: string;
  @IsString() city: string;
  @IsString() state: string;
  @IsString() zipCode: string;
  @IsString() country: string;
  @IsOptional() @IsString() phone?: string;
}

export class CreateOrderDto {
  @ApiProperty()
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
  @IsString() productId: string;
  @IsInt() @Min(1) quantity: number;
}

export class CreateGuestOrderDto {
  @ApiProperty()
  @IsEmail()
  guestEmail: string;

  @ApiProperty()
  @IsString()
  guestName: string;

  @ApiProperty({ type: [GuestOrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => GuestOrderItemDto)
  @ArrayMinSize(1)
  items: GuestOrderItemDto[];

  @ApiProperty()
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
  @ApiProperty({ enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @IsString()
  status: string;
}
