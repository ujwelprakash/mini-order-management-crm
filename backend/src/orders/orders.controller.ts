import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';

import { OrdersService } from './orders.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET ALL ORDERS WITH SEARCH, FILTERS AND PAGINATION
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search = '',
    @Query('financialStatus') financialStatus = '',
    @Query('fulfillmentStatus') fulfillmentStatus = '',
    @Query('startDate') startDate = '',
    @Query('endDate') endDate = '',
    @Query('sortBy') sortBy = 'orderDate',
    @Query('sortOrder') sortOrder = 'desc',
  ) {
    return {
      success: true,
      ...(await this.ordersService.findAll(
        Number(page),
        Number(limit),
        search,
        financialStatus,
        fulfillmentStatus,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      )),
    };
  }

  // GET SINGLE ORDER BY DATABASE ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      success: true,
      order: await this.ordersService.findOne(id),
    };
  }
}
