import {
  Controller,
  Post,
  Req,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { WebhooksService } from './webhooks.service.js';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('orders')
  async handleOrderWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-webhook-id') webhookId: string,
    @Headers('x-shopify-topic') topic: string,
  ) {
    if (!hmac || !webhookId || !topic || !request.rawBody) {
      throw new BadRequestException('Missing webhook headers or raw body');
    }

    const valid = this.webhooksService.verifyWebhook(request.rawBody, hmac);

    if (!valid) {
      throw new UnauthorizedException('Invalid Shopify webhook signature');
    }

    if (!['orders/create', 'orders/updated'].includes(topic)) {
      return {
        success: true,
        message: 'Webhook topic ignored',
      };
    }

    if (!request.body || !request.body.id) {
      throw new BadRequestException('Shopify order payload is missing');
    }

    return this.webhooksService.processOrderWebhook(
      webhookId,
      topic,
      request.body,
    );
  }
}
