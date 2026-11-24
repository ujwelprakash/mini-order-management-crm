import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { OrdersService } from './orders.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OrdersQueryDto } from './dto/orders-query.dto.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: OrdersQueryDto) {
    return this.ordersService.findAll(
      query.page,
      query.limit,
      query.search,
      query.financialStatus ?? '',
      query.fulfillmentStatus ?? '',
      query.startDate ?? '',
      query.endDate ?? '',
      query.sortBy,
      query.sortOrder,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
