import { Module } from '@nestjs/common';
import { ShopifyService } from './shopify.service.js';
import { ShopifyController } from './shopify.controller.js';

@Module({
  providers: [ShopifyService],
  exports: [ShopifyService],
  controllers: [ShopifyController],
})
export class ShopifyModule {}
