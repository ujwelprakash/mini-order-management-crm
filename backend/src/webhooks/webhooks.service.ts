import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { createHmac, timingSafeEqual } from 'crypto';

interface ShopifyWebhookCustomer {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface ShopifyWebhookLineItem {
  id: number | string;
  title: string;
  quantity: number;
  price: string;
}

interface ShopifyOrderWebhookPayload {
  id: number | string;
  order_number?: number | string;
  created_at?: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  total_price: string;
  currency: string;
  customer?: ShopifyWebhookCustomer | null;
  line_items?: ShopifyWebhookLineItem[];
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // Verify Shopify webhook HMAC signature
  verifyWebhook(rawBody: Buffer, receivedHmac: string): boolean {
    try {
      const secret = this.configService.getOrThrow<string>(
        'SHOPIFY_WEBHOOK_SECRET',
      );

      if (!receivedHmac || !/^[A-Za-z0-9+/]+={0,2}$/.test(receivedHmac)) {
        return false;
      }

      const calculatedHmac = createHmac('sha256', secret)
        .update(rawBody)
        .digest();

      const received = Buffer.from(receivedHmac, 'base64');

      if (received.length !== calculatedHmac.length) {
        return false;
      }

      return timingSafeEqual(received, calculatedHmac);
    } catch {
      return false;
    }
  }

  // Normalize Shopify order IDs to GraphQL GID format
  private normalizeShopifyOrderId(id: number | string): string {
    const value = String(id);

    if (value.startsWith('gid://shopify/Order/')) {
      return value;
    }

    return `gid://shopify/Order/${value}`;
  }

  async processOrderWebhook(
    webhookId: string,
    topic: string,
    payload: ShopifyOrderWebhookPayload,
  ) {
    if (
      !payload ||
      payload.id === undefined ||
      payload.id === null ||
      !payload.total_price ||
      !payload.currency
    ) {
      throw new InternalServerErrorException(
        'Invalid Shopify order webhook payload',
      );
    }

    const shop = this.configService.getOrThrow<string>('SHOPIFY_SHOP');
    const shopDomain = `${shop}.myshopify.com`;

    const store = await this.prisma.store.upsert({
      where: { shopDomain },
      update: {},
      create: { shopDomain },
    });

    // Check whether this webhook has already been received
    let existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { webhookId },
    });

    if (existingEvent?.processed) {
      return {
        success: true,
        message: 'Duplicate webhook ignored',
      };
    }

    // Create a new event if this is the first delivery
    if (!existingEvent) {
      try {
        await this.prisma.webhookEvent.create({
          data: {
            webhookId,
            topic,
            storeId: store.id,
            processed: false,
          },
        });
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          existingEvent = await this.prisma.webhookEvent.findUnique({
            where: { webhookId },
          });

          if (existingEvent?.processed) {
            return {
              success: true,
              message: 'Duplicate webhook ignored',
            };
          }
        } else {
          throw error;
        }
      }
    }

    try {
      const rawShopifyOrderId = String(payload.id);

      const normalizedShopifyOrderId = this.normalizeShopifyOrderId(payload.id);

      const orderDate = payload.created_at
        ? new Date(payload.created_at)
        : new Date();

      if (Number.isNaN(orderDate.getTime())) {
        throw new Error('Invalid order date');
      }

      await this.prisma.$transaction(async (tx) => {
        let customerId: string | null = null;

        // Save customer information
        if (payload.customer?.id) {
          const customer = payload.customer;

          const customerName = [customer.first_name, customer.last_name]
            .filter(Boolean)
            .join(' ');

          const savedCustomer = await tx.customer.upsert({
            where: {
              storeId_shopifyCustomerId: {
                storeId: store.id,
                shopifyCustomerId: String(customer.id),
              },
            },
            update: {
              name: customerName || null,
              email: customer.email || null,
              phone: customer.phone || null,
            },
            create: {
              storeId: store.id,
              shopifyCustomerId: String(customer.id),
              name: customerName || null,
              email: customer.email || null,
              phone: customer.phone || null,
            },
          });

          customerId = savedCustomer.id;
        }

        // Support both previously saved numeric IDs and GraphQL GIDs.
        const existingOrder = await tx.order.findFirst({
          where: {
            storeId: store.id,
            shopifyOrderId: {
              in: [rawShopifyOrderId, normalizedShopifyOrderId],
            },
          },
          select: {
            shopifyOrderId: true,
          },
        });

        // Preserve the existing ID when an order already exists.
        // New webhook orders use the normalized GraphQL GID.
        const shopifyOrderId =
          existingOrder?.shopifyOrderId ?? normalizedShopifyOrderId;

        // Create or update the order
        const savedOrder = await tx.order.upsert({
          where: {
            storeId_shopifyOrderId: {
              storeId: store.id,
              shopifyOrderId,
            },
          },
          update: {
            orderNumber: `#${payload.order_number ?? payload.id}`,
            orderDate,
            financialStatus: (
              payload.financial_status || 'UNKNOWN'
            ).toUpperCase(),
            fulfillmentStatus: (
              payload.fulfillment_status || 'UNFULFILLED'
            ).toUpperCase(),
            totalAmount: payload.total_price,
            currency: payload.currency,
            customerId,
          },
          create: {
            storeId: store.id,
            shopifyOrderId,
            orderNumber: `#${payload.order_number ?? payload.id}`,
            orderDate,
            financialStatus: (
              payload.financial_status || 'UNKNOWN'
            ).toUpperCase(),
            fulfillmentStatus: (
              payload.fulfillment_status || 'UNFULFILLED'
            ).toUpperCase(),
            totalAmount: payload.total_price,
            currency: payload.currency,
            customerId,
          },
        });

        // Replace line items to prevent duplicates
        await tx.orderItem.deleteMany({
          where: {
            orderId: savedOrder.id,
          },
        });

        const lineItems = payload.line_items || [];

        if (lineItems.length > 0) {
          await tx.orderItem.createMany({
            data: lineItems.map((item) => ({
              orderId: savedOrder.id,
              shopifyLineItemId: String(item.id),
              productTitle: item.title,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
          });
        }
      });

      // Mark webhook event as successfully processed
      await this.prisma.webhookEvent.update({
        where: { webhookId },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Shopify order webhook processed successfully',
      };
    } catch (error) {
      console.error('Webhook processing failed:', error);

      // Keep processed=false so Shopify can retry
      throw new InternalServerErrorException(
        'Webhook received but order synchronization failed',
      );
    }
  }
}
