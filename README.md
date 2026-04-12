# Simple Commerce Store

A complete mobile-first e-commerce website built with Next.js and JSON file storage.

## Features

- Customer store with product grid and product detail pages
- Product gallery, stock status, description, and embedded YouTube video
- Add to cart and buy now flow
- Cart and checkout pages without login
- Payment selection for PromptPay, Credit Card (Visa), and COD
- LINE and Facebook Messenger contact buttons
- Single-admin dashboard with login
- Product create, edit, delete, image upload, and order viewing
- Local JSON persistence for products and orders

## Project structure

```text
.
|-- app
|   |-- admin
|   |   |-- login/page.tsx
|   |   |-- orders/page.tsx
|   |   |-- page.tsx
|   |   `-- products/page.tsx
|   |-- cart/page.tsx
|   |-- checkout/page.tsx
|   |-- products/[id]/page.tsx
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components
|   |-- admin
|   `-- store
|-- data
|   |-- orders.json
|   `-- products.json
|-- lib
|-- pages
|   `-- api
|       |-- admin
|       |   |-- login.ts
|       |   `-- logout.ts
|       |-- products
|       |   |-- [id].ts
|       |   `-- index.ts
|       |-- orders.ts
|       `-- upload.ts
|-- public
|   |-- payments/promptpay-qr.svg
|   `-- uploads
|-- types
|-- .env.example
|-- middleware.ts
|-- next.config.ts
|-- package.json
`-- tsconfig.json
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Default admin login

- Username: `admin`
- Password: `admin123`

Change these in `.env` before using the app outside local development.

## Local data storage

- Products are stored in `data/products.json`
- Orders are stored in `data/orders.json`
- Uploaded images and slips are stored in `public/uploads`

## Notes

- This project uses simple local file storage to keep the system maintainable.
- Credit card checkout is a form capture flow only. It does not connect to a real payment gateway.
- PromptPay uses a local placeholder QR image and supports slip upload.
