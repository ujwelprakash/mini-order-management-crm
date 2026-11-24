import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

describe('WebhooksController', () => {
  let controller: WebhooksController;

  const webhooksServiceMock = {
    verifyWebhook: vi.fn(),
    processOrderWebhook: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: webhooksServiceMock,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should reject missing webhook headers or raw body', async () => {
    await expect(
      controller.handleOrderWebhook(
        { rawBody: Buffer.from('{}'), body: {} } as any,
        '',
        'webhook-123',
        'orders/create',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject an invalid HMAC signature', async () => {
    webhooksServiceMock.verifyWebhook.mockReturnValue(false);

    await expect(
      controller.handleOrderWebhook(
        { rawBody: Buffer.from('{}'), body: { id: 123 } } as any,
        'invalid-signature',
        'webhook-123',
        'orders/create',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should ignore unsupported webhook topics', async () => {
    webhooksServiceMock.verifyWebhook.mockReturnValue(true);

    const result = await controller.handleOrderWebhook(
      { rawBody: Buffer.from('{}'), body: { id: 123 } } as any,
      'valid-signature',
      'webhook-123',
      'products/create',
    );

    expect(result).toEqual({
      success: true,
      message: 'Webhook topic ignored',
    });

    expect(webhooksServiceMock.processOrderWebhook).not.toHaveBeenCalled();
  });

  it('should process a valid order webhook', async () => {
    webhooksServiceMock.verifyWebhook.mockReturnValue(true);
    webhooksServiceMock.processOrderWebhook.mockResolvedValue({
      success: true,
      message: 'Shopify order webhook processed successfully',
    });

    const payload = { id: 123, total_price: '100.00', currency: 'INR' };

    const result = await controller.handleOrderWebhook(
      { rawBody: Buffer.from(JSON.stringify(payload)), body: payload } as any,
      'valid-signature',
      'webhook-123',
      'orders/create',
    );

    expect(webhooksServiceMock.processOrderWebhook).toHaveBeenCalledWith(
      'webhook-123',
      'orders/create',
      payload,
    );
    expect(result.success).toBe(true);
  });
});
