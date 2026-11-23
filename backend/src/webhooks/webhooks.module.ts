import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ShopifyModule } from '../shopify/shopify.module.js';

@Module({
  imports: [PrismaModule, ShopifyModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
