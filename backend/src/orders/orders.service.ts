import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // GET ALL ORDERS
  async findAll(
    page = 1,
    limit = 10,
    search = '',
    financialStatus = '',
    fulfillmentStatus = '',
    startDate = '',
    endDate = '',
    sortBy = 'orderDate',
    sortOrder = 'desc',
  ) {
    // Validate pagination
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    // Validate sorting
    const allowedSortFields = ['orderDate', 'totalAmount'];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException('sortBy must be orderDate or totalAmount');
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      throw new BadRequestException('sortOrder must be asc or desc');
    }

    // Validate dates
    const parsedStartDate = startDate
      ? new Date(`${startDate}T00:00:00.000Z`)
      : undefined;

    const parsedEndDate = endDate
      ? new Date(`${endDate}T00:00:00.000Z`)
      : undefined;

    if (
      (parsedStartDate && Number.isNaN(parsedStartDate.getTime())) ||
      (parsedEndDate && Number.isNaN(parsedEndDate.getTime()))
    ) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    const skip = (page - 1) * limit;

    // Build database filters
    const where = {
      ...(search && {
        OR: [
          {
            orderNumber: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            customer: {
              is: {
                name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
          {
            customer: {
              is: {
                email: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ],
      }),

      ...(financialStatus && { financialStatus }),

      ...(fulfillmentStatus && { fulfillmentStatus }),

      ...((parsedStartDate || parsedEndDate) && {
        orderDate: {
          ...(parsedStartDate && {
            gte: parsedStartDate,
          }),
          ...(parsedEndDate && {
            lt: new Date(parsedEndDate.getTime() + 24 * 60 * 60 * 1000),
          }),
        },
      }),
    };

    // Fetch orders and total count
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          items: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),

      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      sorting: {
        sortBy,
        sortOrder,
      },
    };
  }

  // GET SINGLE ORDER BY DATABASE ID
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        items: true,
        store: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
