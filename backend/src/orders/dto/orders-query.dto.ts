import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

export class OrdersQueryDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  // Search
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search = '';

  // Financial status filter
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsIn([
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'PARTIALLY_PAID',
    'REFUNDED',
    'VOIDED',
  ])
  financialStatus?: string;

  // Fulfillment status filter
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsIn(['FULFILLED', 'PARTIALLY_FULFILLED', 'UNFULFILLED', 'RESTOCKED'])
  fulfillmentStatus?: string;

  // Start date filter
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // End date filter
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Sorting
  @IsOptional()
  @IsIn(['orderDate', 'totalAmount'])
  sortBy = 'orderDate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder = 'desc';
}
