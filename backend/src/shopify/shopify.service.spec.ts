import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyService } from './shopify.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('ShopifyService', () => {
  let service: ShopifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopifyService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
            getOrThrow: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ShopifyService>(ShopifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
