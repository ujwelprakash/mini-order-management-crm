import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { ShopifyService } from './shopify.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('shopify')
@UseGuards(JwtAuthGuard)
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  // Test Shopify authentication
  @Get('test')
  async testConnection() {
    await this.shopifyService.getAccessToken();

    return {
      success: true,
      message: 'Successfully connected to Shopify',
    };
  }

  // Fetch latest Shopify orders
  @Get('orders')
  async getOrders() {
    const orders = await this.shopifyService.getOrders();

    return {
      success: true,
      count: orders.edges.length,
      orders: orders.edges.map((edge: any) => edge.node),
    };
  }

  // Fetch products for the Create Order form
  @Get('products')
  async getProducts() {
    const products = await this.shopifyService.getProducts();

    return {
      success: true,
      count: products.length,
      products,
    };
  }

  // Create an order in Shopify
  @Post('orders')
  async createOrder(
    @Body()
    body: {
      customerName: string;
      customerEmail: string;
      lineItems: {
        variantId: string;
        quantity: number;
      }[];
    },
  ) {
    return this.shopifyService.createOrder(body);
  }

  // Synchronize Shopify orders into PostgreSQL
  @Post('sync')
  async syncOrders() {
    return this.shopifyService.syncOrders();
  }
}
