# Mini Order Management CRM

A full-stack Order Management CRM built using React, NestJS, PostgreSQL, Prisma ORM, and Shopify Admin API.

The application allows users to manage Shopify orders, search and filter order records, create orders through the CRM, and process order information using Shopify webhooks.

## Live Application

- **Frontend:** https://shopify-crm-frontend.onrender.com
- **Backend:** https://shopify-crm-backend.onrender.com
- **GitHub Repository:** https://github.com/ujwelprakash/mini-order-management-crm

## Demo Access

The application supports user registration and JWT-based authentication.

Evaluators can register a new account through the application and log in to access the CRM.

**Live Application:** https://shopify-crm-frontend.onrender.com

## Features

### 1. Authentication

- User registration and login.
- JWT-based authentication.
- Protected API routes.
- Password hashing using bcrypt.
- Request validation.

### 2. Order Management

- View Shopify orders stored in PostgreSQL.
- Server-side pagination.
- Search by order number and customer name.
- Filter by financial status.
- Filter by fulfillment status.
- Filter orders by date range.
- Sort orders by supported fields and order.
- View detailed order information.
- Create orders through the CRM using Shopify.

### 3. Shopify Integration

- Connect to Shopify Admin API.
- Test Shopify API connectivity.
- Fetch Shopify orders and products.
- Synchronize Shopify orders with the CRM database.
- Create Shopify orders through the CRM.

### 4. Shopify Webhooks

- Support processing `orders/create` and `orders/updated` events.
- Verify Shopify webhook HMAC signatures.
- Prevent duplicate webhook processing.
- Create or update order records when webhook events are processed.
- Store webhook event information for tracking.

### 5. Error Handling and Validation

- Validate incoming request data.
- Handle invalid authentication and requests.
- Handle errors returned by Shopify API requests.
- Handle database and synchronization errors.
- Return appropriate API error responses.

## Technology Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- JavaScript
- Vitest
- React Testing Library

### Backend

- NestJS
- Node.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Passport
- bcrypt
- class-validator
- class-transformer
- Vitest

### External Integration

- Shopify Admin API
- Shopify Webhooks

### Deployment

- Render Static Site
- Render Web Service
- Render PostgreSQL

## Project Structure

```text
mini-order-management-crm/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20261123085459_init/
│   │   │   │   └── migration.sql
│   │   │   ├── 20261124100000_add_customer_details_to_order/
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── dto/
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   └── orders.module.ts
│   │   │
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   │
│   │   ├── shopify/
│   │   │   ├── shopify.controller.ts
│   │   │   ├── shopify.service.ts
│   │   │   └── shopify.module.ts
│   │   │
│   │   ├── webhooks/
│   │   │   ├── webhooks.controller.ts
│   │   │   ├── webhooks.service.ts
│   │   │   └── webhooks.module.ts
│   │   │
│   │   ├── main.ts
│   │   └── app.module.ts
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── test/
│   │
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Database Design

The application uses PostgreSQL with Prisma ORM.

### Store

Stores Shopify store information and maintains relationships with customers, orders, and webhook events.

### User

Stores application user information, including:

- User ID
- Name
- Email
- Hashed password

### Customer

Stores Shopify customer information associated with a store.

### Order

Stores Shopify order information, including:

- Shopify order ID
- Order number
- Order date
- Financial status
- Fulfillment status
- Total amount
- Currency
- Customer information
- Store relationship

### OrderItem

Stores individual order line items, including:

- Shopify line item ID
- Product title
- Quantity
- Unit price

### WebhookEvent

Stores webhook event information, including:

- Webhook ID
- Topic
- Processing status
- Received timestamp
- Processed timestamp
- Associated store

### Database Relationships and Migrations

- A store can have multiple customers, orders, and webhook events.
- A customer can have multiple orders.
- An order can contain multiple order items.
- Each order is associated with a store and can optionally be associated with a customer.
- Shopify order IDs are stored alongside internal database IDs to support synchronization.
- Unique constraints prevent duplicate Shopify records within a store.
- Indexes support common search, filtering, and sorting operations.
- Prisma migrations maintain database schema changes.

### Database Schema and Migrations

The database structure is defined using Prisma ORM.

- **Prisma schema:** `backend/prisma/schema.prisma`
- **Migration files:** `backend/prisma/migrations/`

The repository includes the initial database migration and a subsequent migration adding customer details to orders.

These files are included in the GitHub repository.

## API Endpoints

Protected endpoints require a JWT access token in the Authorization header:

```http
Authorization: Bearer <accessToken>
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Login and receive JWT |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders` | Get orders with pagination, search, filtering, and sorting |
| GET | `/orders/:id` | Get order details |

### Shopify

| Method | Endpoint | Description |
|---|---|---|
| GET | `/shopify/test` | Test Shopify API connection |
| GET | `/shopify/orders` | Fetch Shopify orders |
| GET | `/shopify/products` | Fetch Shopify products |
| POST | `/shopify/orders` | Create an order through Shopify |


### Webhooks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/webhooks/orders` | Receive Shopify order webhook events |

Supported webhook topics:

- `orders/create`
- `orders/updated`

The webhook endpoint verifies Shopify HMAC signatures and handles duplicate webhook IDs.

## Shopify Configuration

### 1. Create a Shopify Development Store

Create a Shopify development store and configure a Shopify app for Admin API access.

### 2. Configure Admin API Access Scopes

The application needs access to the Shopify resources used by its integration.

The expected scopes for the implemented operations are:

- `read_orders` – Read Shopify orders.
- `read_products` – Read products and product variants.
- `write_draft_orders` – Create draft orders through Shopify.

Configure the scopes in the Shopify app and verify that they match the API operations used by the application.

If additional Shopify API operations are introduced, configure their required scopes as well.

### 3. Configure Environment Variables

Create the Shopify app credentials and configure them on the backend using environment variables.

For local development, each developer should use their own Shopify development store and app credentials.

### 4. Configure Webhooks

Configure the following Shopify webhook topics:

- `orders/create`
- `orders/updated`

**Deployed webhook destination:**

```text
https://shopify-crm-backend.onrender.com/webhooks/orders
```

Use the Shopify app client secret on the backend to verify webhook HMAC signatures.

For local webhook testing, Shopify cannot directly access `localhost`. Use a public HTTPS tunnel, such as ngrok or Cloudflare Tunnel, and configure the webhook destination to use the tunnel URL.

## Order Creation Approach

The CRM uses Shopify's draft-order flow to create orders through the Shopify Admin API.

The general process is:

1. The user enters customer and line-item information in the CRM.
2. The backend sends the required information to Shopify.
3. Shopify creates the draft order.
4. The backend completes the draft order to create the order.
5. After successful creation, the corresponding order information is saved in PostgreSQL.
6. The order becomes available in the CRM.

This approach uses Shopify's draft-order functionality before completing the order. It is subject to Shopify API permissions and the behavior of the configured store.

## Environment Configuration

Create separate environment files for the backend and frontend.

### Backend Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_jwt_secret"

SHOPIFY_SHOP=your_shopify_store_name
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_WEBHOOK_SECRET=
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

For the deployed frontend, configure the following environment variable in Render:

```env
VITE_API_URL=https://shopify-crm-backend.onrender.com
```

### Security Notes

- Never commit `.env` files.
- Never expose Shopify credentials in frontend code.
- Never commit database passwords or JWT secrets.
- Configure production secrets through the hosting provider's environment settings.
- Use `.env.example` files with placeholder values when sharing configuration requirements.
- Each developer should configure their own database and Shopify app credentials for local development.

## Installation and Setup

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Shopify development store
- Shopify app credentials

### 1. Clone the Repository

```bash
git clone https://github.com/ujwelprakash/mini-order-management-crm.git

cd mini-order-management-crm
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure `backend/.env` with the required database, JWT, and Shopify environment variables.

Generate the Prisma client:

```bash
npx prisma generate
```

Apply existing database migrations:

```bash
npx prisma migrate deploy
```

Run the backend:

```bash
npm run start:dev
```

Backend runs locally at:

`http://localhost:3000`

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure `frontend/.env` with the backend API URL.

Run the frontend:

```bash
npm run dev
```

Frontend runs locally at:

`http://localhost:5173`

## Running Tests

### Backend Tests

Navigate to the backend directory:

```bash
npm test
```

### Frontend Tests

Navigate to the frontend directory:

```bash
npm test
```

### Automated Test Coverage

The project includes automated backend and frontend tests using Vitest.

**Backend Tests**

- Application and authentication service initialization.
- Order pagination and query validation.
- Invalid pagination and sorting parameters.
- Order search and status filtering.
- Webhook HMAC signature verification.
- Invalid and missing webhook signatures.
- Duplicate webhook delivery handling.
- Webhook controller request handling.

**Frontend Tests**

- Orders page rendering.
- Initial API request.
- Search functionality.
- Payment status filtering.
- Fulfillment status filtering.
- Pagination interactions.

These tests cover selected application logic, request validation, webhook security and order-management interactions. Additional integration and end-to-end testing can be added in future improvements.

## Deployment

The application is deployed using Render.

### Frontend – Render Static Site

The React application is deployed as a Render Static Site.

- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`
- **URL:** https://shopify-crm-frontend.onrender.com

### Backend – Render Web Service

The NestJS backend is deployed as a Render Web Service.

- **URL:** https://shopify-crm-backend.onrender.com
- Production environment variables are configured through Render.

### Database – Render PostgreSQL

PostgreSQL is hosted using Render PostgreSQL.

The backend connects to the hosted database through the `DATABASE_URL` environment variable.

### Prisma Migrations

The Prisma schema and migration files are maintained in the repository under:

`backend/prisma/`

### Shopify Webhooks

Configure Shopify webhook subscriptions to use the deployed endpoint:

```text
https://shopify-crm-backend.onrender.com/webhooks/orders
```

Supported topics:

- `orders/create`
- `orders/updated`

The webhook endpoint is designed to process these events after the corresponding Shopify subscriptions are configured.

## Future Improvements

- Expand automated integration and end-to-end test coverage.
- Add advanced order analytics and reporting.
- Improve application monitoring and error reporting.

## Author

**Ujwel Prakash**

Developed as a Mini Order Management CRM project using React, NestJS, PostgreSQL, Prisma ORM, and Shopify Admin API.