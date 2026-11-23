import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

interface ShopifyTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
}

interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  lineItems: {
    variantId: string;
    quantity: number;
  }[];
}

@Injectable()
export class ShopifyService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // Get Shopify access token
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const shop = this.configService.getOrThrow<string>('SHOPIFY_SHOP');
    const clientId = this.configService.getOrThrow<string>('SHOPIFY_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>(
      'SHOPIFY_CLIENT_SECRET',
    );

    const url = `https://${shop}.myshopify.com/admin/oauth/access_token`;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Shopify returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as ShopifyTokenResponse;

      if (!data.access_token || !data.expires_in) {
        throw new Error('Invalid token response from Shopify');
      }

      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;

      console.log('Shopify access token obtained successfully');

      return this.accessToken;
    } catch (error) {
      this.accessToken = null;
      this.tokenExpiresAt = 0;

      console.error(
        'Shopify authentication failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw new InternalServerErrorException(
        'Unable to authenticate with Shopify',
      );
    }
  }

  // Common Shopify GraphQL request helper
  private async shopifyGraphQL<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const shop = this.configService.getOrThrow<string>('SHOPIFY_SHOP');

    const url = `https://${shop}.myshopify.com/admin/api/2026-10/graphql.json`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`Shopify API returned HTTP ${response.status}`);
      }

      const result = (await response.json()) as {
        data?: T;
        errors?: { message: string }[];
      };

      if (result.errors?.length || !result.data) {
        const message =
          result.errors?.map((error) => error.message).join('; ') ||
          'Invalid Shopify GraphQL response';

        console.error('Shopify GraphQL error:', message);
        throw new Error(message);
      }

      return result.data;
    } catch (error) {
      console.error(
        'Shopify GraphQL request failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Shopify request failed',
      );
    }
  }

  // Fetch Shopify orders
  // Phone is intentionally excluded because this app is not approved
  // to access the protected customer phone field.
  async getOrders() {
    const query = `
      query {
        orders(first: 5, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                id
                firstName
                lastName
                email
              }
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.shopifyGraphQL<{
      orders: { edges: { node: any }[] };
    }>(query);

    console.log('Shopify orders fetched successfully');

    return data.orders;
  }

  // Fetch Shopify product variants for Create Order
  async getProducts() {
    const query = `
      query {
        productVariants(first: 100) {
          edges {
            node {
              id
              displayName
              price
              product {
                title
              }
            }
          }
        }
      }
    `;

    const data = await this.shopifyGraphQL<{
      productVariants: {
        edges: {
          node: {
            id: string;
            displayName: string;
            price: string;
            product: {
              title: string;
            };
          };
        }[];
      };
    }>(query);

    return data.productVariants.edges.map(({ node }) => ({
      variantId: node.id,
      title: node.displayName || node.product.title,
      price: node.price,
    }));
  }

  // Create an order in Shopify and save it in PostgreSQL
  async createOrder(input: CreateOrderInput) {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Order request body is required');
    }

    const customerName = input.customerName?.trim();
    const customerEmail = input.customerEmail?.trim();

    if (
      !customerName ||
      !customerEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) {
      throw new BadRequestException(
        'Valid customer name and email are required',
      );
    }

    if (!Array.isArray(input.lineItems) || input.lineItems.length === 0) {
      throw new BadRequestException('At least one product is required');
    }

    for (const item of input.lineItems) {
      if (
        !item.variantId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        throw new BadRequestException('Invalid product or quantity');
      }
    }

    // Step 1: Create Shopify draft order
    const createDraftMutation = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const draftData = await this.shopifyGraphQL<{
      draftOrderCreate: {
        draftOrder: { id: string } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    }>(createDraftMutation, {
      input: {
        email: customerEmail,
        note: `Created through Mini Order Management CRM. Customer name: ${customerName}`,
        lineItems: input.lineItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      },
    });

    const draftResult = draftData.draftOrderCreate;

    if (draftResult.userErrors.length || !draftResult.draftOrder) {
      throw new BadRequestException(
        draftResult.userErrors.map((error) => error.message).join('; ') ||
          'Unable to create Shopify draft order',
      );
    }

    // Step 2: Complete draft order
    const completeMutation = `
      mutation draftOrderComplete($id: ID!) {
        draftOrderComplete(id: $id) {
          draftOrder {
            id
            order {
              id
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const completeData = await this.shopifyGraphQL<{
      draftOrderComplete: {
        draftOrder: {
          id: string;
          order: { id: string } | null;
        } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    }>(completeMutation, {
      id: draftResult.draftOrder.id,
    });

    const completedResult = completeData.draftOrderComplete;

    if (
      completedResult.userErrors.length ||
      !completedResult.draftOrder?.order
    ) {
      throw new BadRequestException(
        completedResult.userErrors.map((error) => error.message).join('; ') ||
          'Unable to complete Shopify order',
      );
    }

    const shopifyOrderId = completedResult.draftOrder.order.id;

    // Step 3: Fetch completed order details.
    // Do not request customer.phone.
    const orderQuery = `
      query getCreatedOrder($id: ID!) {
        order(id: $id) {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customer {
            id
            firstName
            lastName
            email
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    `;

    const orderData = await this.shopifyGraphQL<{
      order: any;
    }>(orderQuery, { id: shopifyOrderId });

    if (!orderData.order) {
      throw new InternalServerErrorException(
        'Shopify created the order, but its details could not be retrieved. Run Sync Orders to import it.',
      );
    }

    // Step 4: Save completed order in PostgreSQL
    const savedOrderId = await this.saveOrder(orderData.order);

    console.log(`Shopify order ${orderData.order.name} saved in PostgreSQL`);

    return {
      success: true,
      message: 'Order created in Shopify and saved in PostgreSQL',
      orderId: savedOrderId,
      shopifyOrderId,
      orderNumber: orderData.order.name,
    };
  }

  // Save or update one Shopify order in PostgreSQL
  private async saveOrder(order: any): Promise<string> {
    const shop = this.configService.getOrThrow<string>('SHOPIFY_SHOP');

    const store = await this.prisma.store.upsert({
      where: {
        shopDomain: `${shop}.myshopify.com`,
      },
      update: {},
      create: {
        shopDomain: `${shop}.myshopify.com`,
      },
    });

    return this.prisma.$transaction(async (tx) => {
      let customerId: string | null = null;
      const shopifyCustomer = order.customer;

      if (shopifyCustomer?.id) {
        const customerName =
          [shopifyCustomer.firstName, shopifyCustomer.lastName]
            .filter(Boolean)
            .join(' ') || null;

        const customer = await tx.customer.upsert({
          where: {
            storeId_shopifyCustomerId: {
              storeId: store.id,
              shopifyCustomerId: shopifyCustomer.id,
            },
          },
          update: {
            name: customerName,
            email: shopifyCustomer.email ?? null,
            // Phone access is not approved, so do not request or store it.
            phone: null,
          },
          create: {
            storeId: store.id,
            shopifyCustomerId: shopifyCustomer.id,
            name: customerName,
            email: shopifyCustomer.email ?? null,
            phone: null,
          },
        });

        customerId = customer.id;
      }

      const savedOrder = await tx.order.upsert({
        where: {
          storeId_shopifyOrderId: {
            storeId: store.id,
            shopifyOrderId: order.id,
          },
        },
        update: {
          orderNumber: order.name,
          orderDate: new Date(order.createdAt),
          financialStatus: order.displayFinancialStatus,
          fulfillmentStatus: order.displayFulfillmentStatus,
          totalAmount: order.totalPriceSet.shopMoney.amount,
          currency: order.totalPriceSet.shopMoney.currencyCode,
          customerId,
        },
        create: {
          storeId: store.id,
          shopifyOrderId: order.id,
          orderNumber: order.name,
          orderDate: new Date(order.createdAt),
          financialStatus: order.displayFinancialStatus,
          fulfillmentStatus: order.displayFulfillmentStatus,
          totalAmount: order.totalPriceSet.shopMoney.amount,
          currency: order.totalPriceSet.shopMoney.currencyCode,
          customerId,
        },
      });

      // Replace existing line items to avoid duplicates during sync.
      await tx.orderItem.deleteMany({
        where: { orderId: savedOrder.id },
      });

      const lineItems = order.lineItems.edges.map((edge: any) => ({
        orderId: savedOrder.id,
        shopifyLineItemId: edge.node.id,
        productTitle: edge.node.title,
        quantity: edge.node.quantity,
        unitPrice: edge.node.originalUnitPriceSet.shopMoney.amount,
      }));

      if (lineItems.length > 0) {
        await tx.orderItem.createMany({
          data: lineItems,
        });
      }

      return savedOrder.id;
    });
  }

  // Import Shopify orders into PostgreSQL
  async syncOrders() {
    try {
      const ordersData = await this.getOrders();
      let syncedCount = 0;

      for (const edge of ordersData.edges) {
        await this.saveOrder(edge.node);
        syncedCount++;
      }

      return {
        success: true,
        message: 'Shopify orders synchronized successfully',
        syncedCount,
      };
    } catch (error) {
      console.error(
        'Order synchronization failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw new InternalServerErrorException(
        'Unable to synchronize Shopify orders',
      );
    }
  }
}
