# Thread Haus — Full-Stack T-Shirt eCommerce

A production-ready full-stack eCommerce platform built with Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma ORM, JWT Auth, Redux Toolkit, and payment integrations (bKash, Nagad, Stripe).

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| State Management | Redux Toolkit |
| Auth | JWT (jose library) |
| Database | PostgreSQL + Prisma ORM |
| Payments | bKash API, Nagad API, Stripe |
| Image Upload | Cloudinary |
| Deployment | Vercel (recommended) |

---

## 📁 Folder Structure

```
tshirt-ecommerce/
├── app/
│   ├── (public)/              # Public-facing routes (Navbar + Footer)
│   │   ├── page.tsx           # Homepage
│   │   ├── login/page.tsx     # Login
│   │   ├── register/page.tsx  # Registration
│   │   ├── products/
│   │   │   ├── page.tsx       # Product listing with search/filter
│   │   │   └── [id]/page.tsx  # Product detail + T-shirt customizer
│   │   ├── cart/page.tsx      # Shopping cart
│   │   ├── checkout/page.tsx  # Checkout with payment selection
│   │   ├── orders/page.tsx    # Customer order history
│   │   └── order-confirmation/[id]/page.tsx
│   │
│   ├── dashboard/             # Admin-only panel
│   │   ├── layout.tsx         # Admin sidebar layout
│   │   ├── page.tsx           # Analytics dashboard
│   │   ├── products/page.tsx  # Full CRUD products
│   │   ├── orders/page.tsx    # Order management + status updates
│   │   ├── customers/page.tsx # Block/unblock users
│   │   └── site/page.tsx      # Banner/UI editor
│   │
│   ├── editor/                # Editor panel (limited access)
│   │   ├── layout.tsx
│   │   └── products/page.tsx  # Update + Delete only
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   └── me/route.ts
│       ├── products/
│       │   ├── route.ts       # GET all, POST (Admin only)
│       │   └── [id]/route.ts  # GET, PATCH, DELETE
│       ├── orders/
│       │   ├── route.ts       # GET all (Admin), POST create
│       │   ├── me/route.ts    # GET customer's orders
│       │   └── [id]/route.ts  # PATCH status (Admin)
│       ├── users/
│       │   ├── route.ts       # GET users (Admin)
│       │   └── block/route.ts # Block/unblock (Admin)
│       ├── payments/
│       │   ├── stripe/route.ts
│       │   ├── bkash/
│       │   │   ├── route.ts
│       │   │   └── callback/route.ts
│       │   └── nagad/route.ts
│       ├── admin/
│       │   └── analytics/route.ts
│       └── upload/route.ts    # Cloudinary image upload
│
├── components/
│   ├── navbar.tsx
│   ├── footer.tsx
│   ├── product-card.tsx
│   ├── admin-sidebar.tsx
│   ├── providers.tsx          # Redux + Auth initializer
│   └── ui/                    # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── select.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
│
├── store/
│   ├── index.ts               # Redux store
│   ├── hooks.ts               # Typed hooks
│   └── slices/
│       ├── authSlice.ts       # User auth state
│       ├── cartSlice.ts       # Shopping cart (localStorage)
│       └── orderSlice.ts      # Orders state
│
├── lib/
│   ├── prisma.ts              # Prisma singleton
│   ├── auth.ts                # JWT sign/verify
│   ├── api.ts                 # Response helpers
│   ├── payments.ts            # bKash, Nagad, Stripe
│   ├── cloudinary.ts          # Image upload
│   └── utils.ts               # cn() utility
│
├── prisma/
│   ├── schema.prisma          # DB models
│   └── seed.ts                # Initial data seeder
│
├── middleware.ts               # Route protection
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

---

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repo>
cd tshirt-ecommerce
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Fill in all your credentials
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb tshirt_ecommerce

# Push schema
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed initial data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@threadhaus.com | admin123 |
| Editor | editor@threadhaus.com | editor123 |
| Customer | Register at /register | — |

---

## 🔑 Role Permissions

| Feature | Admin | Editor | Customer |
|---------|-------|--------|----------|
| View dashboard | ✅ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ |
| Create products | ✅ | ❌ | ❌ |
| Update products | ✅ | ✅ | ❌ |
| Delete products | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Block/unblock | ✅ | ❌ | ❌ |
| View all orders | ✅ | ❌ | ❌ |
| Place orders | ❌ | ❌ | ✅ |
| View own orders | ❌ | ❌ | ✅ |
| Customize T-shirt | ❌ | ❌ | ✅ |

---

## 💳 Payment Integration

### bKash (Sandbox)
1. Register at https://developer.bka.sh
2. Get sandbox credentials
3. Add to `.env.local`
4. Test with sandbox phone numbers

### Nagad (Sandbox)
1. Contact Nagad developer support
2. Get merchant credentials
3. Add RSA keys to `.env.local`

### Stripe (Card)
1. Register at https://stripe.com
2. Get API keys from dashboard
3. Add publishable + secret key to `.env.local`
4. Install Stripe CLI for webhook testing

---

## 🎨 Design System

Dark industrial aesthetic with:
- **Font**: Bebas Neue (display) + DM Sans (body)
- **Primary**: Burnt orange (#f97316)
- **Background**: Near-black with subtle warm undertone
- **Borders**: Low-contrast dark borders
- **Effects**: Noise texture overlay, gradient backgrounds

---

## 📦 Deployment

### Vercel (recommended)

1. **Install Vercel CLI** (optional; you can also connect via GitHub in the Vercel dashboard):
   ```bash
   npm i -g vercel
   ```

2. **Build locally** to confirm the project builds:
   ```bash
   npm run build
   ```

3. **Deploy**:
   - **From CLI:** Run `vercel` in the project root and follow the prompts. Use `vercel --prod` for production.
   - **From GitHub:** Push your repo, then at [vercel.com](https://vercel.com) click **Add New Project**, import the repo, and leave **Framework Preset** as Next.js. Vercel will use the existing `vercel.json` and `package.json` build script.

4. **Environment variables** (Vercel project → Settings → Environment Variables). Add the same vars you use in `.env` / `.env.local`:
   - `DATABASE_URL` — Postgres connection string (required)
   - `JWT_SECRET` — Secret for JWT signing (required)
   - `NEXTAUTH_URL` or `NEXT_PUBLIC_APP_URL` — Production URL (e.g. `https://your-app.vercel.app`) if the app uses it
   - **Payments:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `BKASH_*`, `NAGAD_*` (as needed)
   - **Cloudinary:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (for image uploads)
   - **Email (optional):** `SMTP_*` or your email provider vars

5. **Database:** Use a hosted Postgres (e.g. **Neon**, **Supabase**, **Railway**) and set `DATABASE_URL` in Vercel. Run migrations (e.g. `npx prisma migrate deploy` or `prisma db push`) against the production DB before or right after first deploy.

6. **Redeploy** after adding or changing environment variables so the new values are applied.

### Database options
- **Neon** — Serverless Postgres, free tier, works well with Vercel
- **Supabase** — Postgres with auth/storage extras
- **Railway** — Simple deployment and Postgres

---

## 🛡️ Security Features

- JWT tokens (7-day expiry)
- bcryptjs password hashing (12 rounds)
- Role-based middleware protection
- Blocked user detection on every request
- Price validation server-side (prevents client manipulation)
- API route authentication on all protected endpoints

---

## 📋 API Reference

### Auth
- `POST /api/auth/register` — Customer registration
- `POST /api/auth/login` — Login (all roles)
- `GET /api/auth/me` — Get current user

### Products
- `GET /api/products` — List products (public, with pagination/search/filter)
- `POST /api/products` — Create product (Admin only)
- `GET /api/products/:id` — Get single product
- `PATCH /api/products/:id` — Update (Admin + Editor)
- `DELETE /api/products/:id` — Delete (Admin + Editor)

### Orders
- `POST /api/orders` — Create order (Customer)
- `GET /api/orders` — All orders (Admin)
- `GET /api/orders/me` — My orders (Customer)
- `PATCH /api/orders/:id` — Update status (Admin)

### Users
- `GET /api/users` — List users (Admin)
- `PATCH /api/users/block` — Block/unblock (Admin)

### Payments
- `POST /api/payments/stripe` — Create payment intent
- `POST /api/payments/bkash` — Initiate bKash
- `GET /api/payments/bkash/callback` — bKash callback handler

### Admin
- `GET /api/admin/analytics` — Dashboard stats (Admin)

### Uploads
- `POST /api/upload` — Cloudinary image upload (Admin + Editor)
