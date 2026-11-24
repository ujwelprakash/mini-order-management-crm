
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([{ id: 'order-1' }]),
        count: vi.fn().mockResolvedValue(1),
        findUnique: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(
        async (operations: Promise<unknown>[]) =>
          Promise.all(operations),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject an invalid page number', async () => {
    await expect(service.findAll(0)).rejects.toThrow(BadRequestException);
  });

  it('should reject a limit greater than 100', async () => {
    await expect(service.findAll(1, 101)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject an invalid sort field', async () => {
    await expect(
      service.findAll(1, 10, '', '', '', '', '', 'invalidField'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject an invalid sort order', async () => {
    await expect(
      service.findAll(1, 10, '', '', '', '', '', 'orderDate', 'wrong'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject a start date after the end date', async () => {
    await expect(
      service.findAll(1, 10, '', '', '', '2026-12-10', '2026-12-01'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return orders with pagination details', async () => {
    const result = await service.findAll(1, 10);

    expect(result.orders).toEqual([{ id: 'order-1' }]);
    expect(result.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should apply search and status filters', async () => {
    await service.findAll(1, 10, 'John', 'PAID', 'FULFILLED');

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          financialStatus: 'PAID',
          fulfillmentStatus: 'FULFILLED',
          OR: expect.any(Array),
        }),
      }),
    );
  });
});
