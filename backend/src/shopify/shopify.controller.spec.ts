import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyController } from './shopify.controller.js';
import { ShopifyService } from './shopify.service.js';

describe('ShopifyController', () => {
  let controller: ShopifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopifyController],
      providers: [
        {
          provide: ShopifyService,
          useValue: {
            testConnection: vi.fn(),
            getOrders: vi.fn(),
            getProducts: vi.fn(),
            createOrder: vi.fn(),
            syncOrders: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ShopifyController>(ShopifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
