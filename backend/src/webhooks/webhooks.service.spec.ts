
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createHmac } from 'crypto';

describe('WebhooksService', () => {
  let service: WebhooksService;

  const secret = 'test-shopify-secret';
  const rawBody = Buffer.from(
    JSON.stringify({ id: 12345, total_price: '100.00', currency: 'INR' }),
  );

  const configMock = {
    getOrThrow: vi.fn((key: string) => {
      if (key === 'SHOPIFY_WEBHOOK_SECRET') return secret;
      if (key === 'SHOPIFY_SHOP') return 'test-store';
      return undefined;
    }),
  };

  const prismaMock = {
    store: {
      upsert: vi.fn(),
    },
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: ConfigService, useValue: configMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyWebhook', () => {
    it('should accept a valid Shopify HMAC signature', () => {
      const signature = createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64');

      expect(service.verifyWebhook(rawBody, signature)).toBe(true);
    });

    it('should reject an invalid Shopify HMAC signature', () => {
      expect(service.verifyWebhook(rawBody, 'invalid-signature')).toBe(false);
    });

    it('should reject an empty signature', () => {
      expect(service.verifyWebhook(rawBody, '')).toBe(false);
    });
  });

  describe('processOrderWebhook', () => {
    it('should ignore an already processed duplicate webhook', async () => {
      prismaMock.store.upsert.mockResolvedValue({
        id: 'store-1',
      });

      prismaMock.webhookEvent.findUnique.mockResolvedValue({
        webhookId: 'webhook-123',
        processed: true,
      });

      const payload = {
        id: 12345,
        total_price: '100.00',
        currency: 'INR',
      };

      const result = await service.processOrderWebhook(
        'webhook-123',
        'orders/create',
        payload,
      );

      expect(result).toEqual({
        success: true,
        message: 'Duplicate webhook ignored',
      });

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.webhookEvent.update).not.toHaveBeenCalled();
    });
  });
});
