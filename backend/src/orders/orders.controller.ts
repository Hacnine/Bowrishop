import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateGuestOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Public: guest checkout */
  @Post('guest')
  createGuestOrder(@Body() dto: CreateGuestOrderDto) {
    return this.ordersService.createGuestOrder(dto);
  }

  /** Public: guest order lookup by id */
  @Get('guest/:id')
  getGuestOrder(@Param('id') id: string) {
    return this.ordersService.getGuestOrderById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getUserOrders(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ordersService.getUserOrders(user.id, page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin')
  getAdminOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getAdminOrders(page, limit, status);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(user.id, id, user.role === 'ADMIN');
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}

