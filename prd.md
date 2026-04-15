# CharityBid: Complete Project Blueprint

> This document is the single source of truth for building CharityBid. Every architectural decision, data model, function signature, component contract, and edge case is specified here. Follow it section by section. Do not invent patterns outside this document without updating it first.

---

## 1. Product Overview

**Name:** CharityBid
**Concept:** A premium, real-time auction platform where users bid on exclusive meetings, dinners, or coaching sessions with successful/famous individuals. 100% of the winning bid goes to the celebrity's charity of choice.

### 1.1 Target Audience
- **Bidders:** High-net-worth individuals, aspiring entrepreneurs, or superfans willing to pay a premium for exclusive access and philanthropic contribution.
- **Celebrities/Influencers:** Successful individuals looking for a low-friction way to raise significant funds for their favorite causes.

### 1.2 Key Value Proposition
- **Premium feel.** The UI must read like a fintech product — dark mode, crisp type, generous whitespace. Not a legacy charity portal.
- **Urgency.** Real-time bidding with visible countdowns and popcorn extensions creates competitive energy that drives up donation totals.
- **Low friction.** Magic links, one-click quick bids, card-on-file — every step minimizes drop-off.

### 1.3 MVP Boundary
What ships:
- Public auction discovery (home page + auction detail pages)
- Passwordless auth (magic link) + Google OAuth
- Real-time bidding room with popcorn timer extension
- Stripe card-on-file + charge-on-win
- Automated auction close via cron

What does NOT ship (V2):
- Admin dashboard (auctions seeded via SQL/Supabase Studio)
- Stripe Connect (payout to charities automated)
- Email notifications (bid outbid, auction won)
- Celebrity self-service onboarding
- Auction scheduling (start_time in the future)
- Bidder verification / KYC

---

## 2. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | RSC for SEO, Server Actions for mutations, Vercel cron for scheduling |
| Language | TypeScript (strict) | End-to-end type safety with generated Supabase types |
| Styling | Tailwind CSS v4 + shadcn/ui | Rapid, consistent UI. Dark mode via CSS variables |
| Animation | Framer Motion | Bid entrance animations, timer pulse effects |
| Database | Supabase (PostgreSQL 15) | RLS, Realtime WebSockets, Auth — one platform |
| Auth | Supabase GoTrue | Magic link + Google OAuth. JWT propagated to RLS |
| Payments | Stripe (Payment Intents + Setup Intents) | SetupIntent to save cards, PaymentIntent to charge winners |
| Hosting | Vercel | Zero-config Next.js deployment, cron jobs, edge middleware |
| Types | `supabase gen types` | Generated from live schema — never hand-write DB types |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│                                                              │
│  Server Components ──────── initial HTML + data (SEO)        │
│  Client Components ──────── interactivity, WebSocket, forms  │
│       │            │                                         │
│       │            └── Supabase Realtime (WebSocket)         │
│       │                 - bids INSERT on auction_id           │
│       │                 - auctions UPDATE on id               │
│       │                                                      │
│       ▼                                                      │
│  Server Actions (Next.js) ── mutations over POST             │
│       │                                                      │
│       ├── supabase/server (user JWT from cookies)            │
│       │     └── RPC: place_bid()                             │
│       │                                                      │
│       ├── supabase/admin (service role)                      │
│       │     └── used ONLY by cron & webhook routes            │
│       │                                                      │
│       └── stripe (server SDK)                                │
│             └── SetupIntents, PaymentIntents                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    Supabase DB         Supabase Auth         Stripe API
    (PostgreSQL)        (GoTrue/JWT)          (Payments)
         │
    ┌────┴────┐
    │ RLS     │  ← SELECT open, INSERT gated by place_bid()
    │ Triggers│  ← Realtime broadcast on INSERT/UPDATE
    │ Functions│ ← place_bid() = atomic bid placement
    └─────────┘
```

### 3.1 Three Tiers, Clear Boundaries

1. **Client tier.** React Server Components render the shell (layout, nav, auction grids, SEO metadata). Client Components own all interactive state: the bidding room, countdown timer, bid form, payment form, and realtime subscriptions. No global state library — React `useState` + props from server + WebSocket events.

2. **API tier.** Next.js Server Actions handle all mutations. No REST routes except two: `POST /api/stripe/webhook` (Stripe events) and `GET /api/cron/close-auctions` (Vercel cron). Server Actions use the Supabase server client which inherits the user's JWT from cookies — this means `auth.uid()` works inside RLS and database functions.

3. **Data tier.** PostgreSQL is the single source of truth. The `place_bid()` function is the critical path — it serializes concurrent bids using `SELECT FOR UPDATE`, validates all business rules, and returns the new bid or an error. No application-layer bid validation exists outside this function. RLS protects direct table access. Supabase Realtime broadcasts INSERT/UPDATE events to subscribed clients.

---

## 4. Database Schema

### 4.1 Enums

```sql
CREATE TYPE auction_status AS ENUM ('active', 'closed');
```

Only two states for MVP. `active` = open for bidding. `closed` = auction ended, winner determined. No `scheduled` state — auctions go live the moment an admin inserts them.

### 4.2 Tables

#### `public.users`
Extends Supabase `auth.users`. Created automatically via a trigger on `auth.users` INSERT.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, references `auth.users(id)` ON DELETE CASCADE | 1:1 with auth user |
| `name` | `text` | NOT NULL, DEFAULT `''` | Display name. Empty until user sets it |
| `avatar_url` | `text` | NULLABLE | From OAuth provider or uploaded |
| `stripe_customer_id` | `text` | NULLABLE, UNIQUE | Set when user first adds a payment method |
| `has_payment_method` | `boolean` | NOT NULL, DEFAULT `false` | Denormalized — true after successful SetupIntent. Avoids Stripe API call on every bid |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### `public.auctions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `slug` | `text` | NOT NULL, UNIQUE | URL-friendly identifier, e.g. `dinner-with-tim-cook` |
| `celebrity_name` | `text` | NOT NULL | Display name |
| `celebrity_title` | `text` | NOT NULL | E.g., "CEO of Apple" |
| `description` | `text` | NOT NULL | Rich text describing the experience |
| `charity_name` | `text` | NOT NULL | Benefitting organization |
| `charity_website` | `text` | NULLABLE | Link to charity |
| `image_url` | `text` | NOT NULL | Hero image (stored as external URL for MVP) |
| `starting_price` | `integer` | NOT NULL, DEFAULT `10000` | In cents. $100 default starting bid |
| `min_increment` | `integer` | NOT NULL, DEFAULT `1000` | In cents. $10 minimum raise |
| `current_max_bid` | `integer` | NOT NULL, DEFAULT `0` | Denormalized. Updated atomically by `place_bid()` |
| `bid_count` | `integer` | NOT NULL, DEFAULT `0` | Denormalized. For display on cards |
| `end_time` | `timestamptz` | NOT NULL | Mutable — extended by popcorn bidding |
| `original_end_time` | `timestamptz` | NOT NULL | Immutable — the originally scheduled end time |
| `status` | `auction_status` | NOT NULL, DEFAULT `'active'` | |
| `winner_id` | `uuid` | NULLABLE, references `users(id)` | Set when auction closes |
| `winning_bid_id` | `uuid` | NULLABLE, references `bids(id)` | Set when auction closes |
| `featured` | `boolean` | NOT NULL, DEFAULT `false` | Exactly one auction should be featured for the hero |
| `payment_intent_id` | `text` | NULLABLE | Stripe PaymentIntent ID after charging the winner |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### `public.bids`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `auction_id` | `uuid` | NOT NULL, references `auctions(id)` | |
| `user_id` | `uuid` | NOT NULL, references `users(id)` | |
| `amount` | `integer` | NOT NULL | In cents |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Immutable.** No UPDATE or DELETE ever. Bids are an append-only ledger.

### 4.3 Indexes

```sql
-- Fast lookup of highest bid per auction (used in the bid feed)
CREATE INDEX idx_bids_auction_amount ON bids (auction_id, amount DESC);

-- Fast lookup of user's bids (for "your bids" display)
CREATE INDEX idx_bids_user ON bids (user_id, created_at DESC);

-- Cron job needs to find active auctions past their end time
CREATE INDEX idx_auctions_active_end ON auctions (end_time) WHERE status = 'active';

-- Slug lookup for URL routing
CREATE UNIQUE INDEX idx_auctions_slug ON auctions (slug);
```

### 4.4 Realtime Configuration

```sql
-- Required for Supabase Realtime UPDATE payloads to include all columns
ALTER TABLE auctions REPLICA IDENTITY FULL;
-- bids only needs INSERT events, default REPLICA IDENTITY is fine
```

Without `REPLICA IDENTITY FULL` on `auctions`, Realtime UPDATE events only include the primary key. We need the full row so the client can read the updated `end_time` and `current_max_bid`.

---

## 5. Database Functions & Triggers

### 5.1 `place_bid()` — The Critical Path

This is the single most important piece of code in the system. All bid placement goes through this function. It serializes concurrent bids, validates business rules, and updates denormalized columns — all in one atomic transaction.

```sql
CREATE OR REPLACE FUNCTION place_bid(
  p_auction_id uuid,
  p_amount integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_auction auctions%ROWTYPE;
  v_bid bids%ROWTYPE;
  v_has_payment boolean;
BEGIN
  -- 1. Authenticate: derive user from JWT (not from parameter — prevents spoofing)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- 2. Verify payment method on file
  SELECT has_payment_method INTO v_has_payment FROM users WHERE id = v_user_id;
  IF NOT v_has_payment THEN
    RETURN jsonb_build_object('error', 'Payment method required');
  END IF;

  -- 3. Lock the auction row — serializes concurrent bids
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

  IF v_auction IS NULL THEN
    RETURN jsonb_build_object('error', 'Auction not found');
  END IF;

  IF v_auction.status != 'active' THEN
    RETURN jsonb_build_object('error', 'Auction is not active');
  END IF;

  IF v_auction.end_time <= now() THEN
    RETURN jsonb_build_object('error', 'Auction has ended');
  END IF;

  -- 4. Validate bid amount
  IF v_auction.current_max_bid = 0 THEN
    -- First bid: must meet starting price
    IF p_amount < v_auction.starting_price THEN
      RETURN jsonb_build_object('error', 'Bid must be at least the starting price');
    END IF;
  ELSE
    -- Subsequent bid: must exceed current max by minimum increment
    IF p_amount < v_auction.current_max_bid + v_auction.min_increment THEN
      RETURN jsonb_build_object('error',
        format('Bid must be at least %s', v_auction.current_max_bid + v_auction.min_increment));
    END IF;
  END IF;

  -- 5. Insert the bid
  INSERT INTO bids (auction_id, user_id, amount)
  VALUES (p_auction_id, v_user_id, p_amount)
  RETURNING * INTO v_bid;

  -- 6. Update auction: max bid, count, and popcorn timer extension
  UPDATE auctions
  SET
    current_max_bid = p_amount,
    bid_count = bid_count + 1,
    end_time = CASE
      WHEN end_time - now() < interval '5 minutes'
      THEN now() + interval '5 minutes'
      ELSE end_time
    END
  WHERE id = p_auction_id;

  -- 7. Return the bid
  RETURN jsonb_build_object(
    'bid', jsonb_build_object(
      'id', v_bid.id,
      'auction_id', v_bid.auction_id,
      'user_id', v_bid.user_id,
      'amount', v_bid.amount,
      'created_at', v_bid.created_at
    )
  );
END;
$$;
```

**Why SECURITY DEFINER?** The function runs as the table owner, bypassing RLS. This is intentional — `place_bid()` IS the access control. It derives the user from `auth.uid()` (the JWT), does its own validation, and no direct INSERT to `bids` is allowed via RLS (see Section 6). The function is the only way to create a bid.

**Why `SELECT FOR UPDATE`?** Two bids arriving simultaneously will serialize on this lock. The second bid sees the updated `current_max_bid` from the first. Without this, both could read the same `current_max_bid` and both "win" the validation check — a classic race condition.

**Why return JSONB instead of raising exceptions?** Server Actions can parse the JSON response and show user-friendly errors. Exceptions from RPC calls in Supabase surface as opaque 400 errors that are harder to parse on the client.

### 5.2 `handle_new_user()` — Auto-create public profile

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 5.3 `update_updated_at()` — Timestamp maintenance

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. Row Level Security (RLS)

RLS is enabled on ALL public tables. The policies below are exhaustive — if a policy isn't listed, that operation is denied.

### `users`
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read any user (for displaying bidder names)
CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT USING (true);

-- Users can only update their own profile (name, avatar)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT handled by trigger (SECURITY DEFINER), no direct INSERT policy needed
-- DELETE not allowed
```

### `auctions`
```sql
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

-- Anyone can read auctions
CREATE POLICY "Auctions are publicly readable"
  ON auctions FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies. Admin manages via Supabase Studio or service role.
-- The place_bid() function updates auctions using SECURITY DEFINER.
```

### `bids`
```sql
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Anyone can read bids (public bid feed)
CREATE POLICY "Bids are publicly readable"
  ON bids FOR SELECT USING (true);

-- No INSERT policy. All inserts go through place_bid() which is SECURITY DEFINER.
-- No UPDATE/DELETE policies. Bids are immutable.
```

**Key insight:** By having NO direct INSERT policy on `bids`, we force all bid creation through `place_bid()`. This means even if someone crafts a direct Supabase client INSERT, RLS blocks it. The function is the only door.

---

## 7. Stripe Integration Lifecycle

### 7.1 Saving a Card (Before First Bid)

```
User clicks "Add Payment Method"
  → Client calls Server Action: createSetupIntent()
    → Server creates Stripe Customer (if not exists)
    → Server creates SetupIntent (customer, usage: 'off_session')
    → Server stores stripe_customer_id on users table
    → Server returns { clientSecret }
  → Client renders <PaymentElement> with clientSecret
  → User enters card, submits
  → Stripe.js confirms the SetupIntent client-side
    → On success: Client calls Server Action: confirmPaymentMethod()
      → Server sets has_payment_method = true on users table
      → UI updates, bid buttons become active
```

**Why SetupIntent instead of PaymentIntent?** We're not charging now — we're saving a card for future use. SetupIntent with `usage: 'off_session'` sets up the payment method for later charges without the customer present (when the auction closes automatically).

### 7.2 Charging the Winner (On Auction Close)

```
Vercel cron fires every 60 seconds
  → GET /api/cron/close-auctions (verified by CRON_SECRET)
    → Query: SELECT * FROM auctions WHERE status = 'active' AND end_time < now()
    → For each expired auction:
      1. Find highest bid: SELECT * FROM bids WHERE auction_id = X ORDER BY amount DESC LIMIT 1
      2. Get winner's stripe_customer_id from users table
      3. Get winner's default payment method from Stripe
      4. Create PaymentIntent:
           amount: winning bid amount
           currency: 'usd'
           customer: winner's stripe_customer_id
           payment_method: winner's default PM
           off_session: true
           confirm: true
      5. If successful:
           UPDATE auctions SET
             status = 'closed',
             winner_id = winner.user_id,
             winning_bid_id = winning_bid.id,
             payment_intent_id = pi.id
           WHERE id = auction.id
      6. If no bids:
           UPDATE auctions SET status = 'closed' WHERE id = auction.id
      7. If payment fails:
           Log error, UPDATE auctions SET status = 'closed', winner_id, winning_bid_id
           (Admin handles payment retry manually for MVP)
```

### 7.3 Stripe Webhook (Safety Net)

Route: `POST /api/stripe/webhook`

Listen for:
- `payment_intent.succeeded` — confirm the `payment_intent_id` matches, log success
- `payment_intent.payment_failed` — alert admin (log or email)

For MVP, the webhook is a safety net, not the primary flow. The cron job is the primary trigger. The webhook confirms outcomes.

### 7.4 Money Flow (MVP)

All funds land in the **platform's Stripe account**. The platform operator manually transfers to the charity and uploads a receipt. Stripe Connect (splitting funds directly to charity accounts) is V2.

---

## 8. Server Actions

All server actions live in `src/actions/`. They are `"use server"` functions called directly from Client Components.

### `bid.ts`

```typescript
// placeBid(auctionId: string, amount: number): Promise<BidResult>
//
// 1. Get authenticated user from Supabase server client (cookies)
// 2. Call supabase.rpc('place_bid', { p_auction_id, p_amount })
// 3. Parse the JSONB response
// 4. Return { success: true, bid } or { success: false, error: string }
//
// No application-layer validation beyond basic type checks.
// All business logic is in the database function.
```

### `payment.ts`

```typescript
// createSetupIntent(): Promise<{ clientSecret: string }>
//
// 1. Get authenticated user
// 2. If user has no stripe_customer_id:
//    a. Create Stripe customer (email from auth, name from profile)
//    b. Update users.stripe_customer_id
// 3. Create SetupIntent(customer, usage: 'off_session')
// 4. Return { clientSecret }

// confirmPaymentMethod(): Promise<{ success: boolean }>
//
// 1. Get authenticated user
// 2. Verify Stripe customer has at least one payment method (Stripe API call)
// 3. Update users.has_payment_method = true
// 4. Return { success: true }
```

### `auth.ts`

```typescript
// signInWithMagicLink(email: string): Promise<{ success: boolean }>
//
// 1. Call supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
// 2. Return success

// signInWithGoogle(): Promise<{ url: string }>
//
// 1. Call supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
// 2. Return the OAuth URL (client redirects)

// signOut(): Promise<void>
//
// 1. Call supabase.auth.signOut()
// 2. Redirect to home
```

### `profile.ts`

```typescript
// updateProfile(name: string): Promise<{ success: boolean }>
//
// 1. Get authenticated user
// 2. Update users.name where id = user.id
// 3. Return success
```

---

## 9. API Routes

### `GET /api/cron/close-auctions`

Triggered by Vercel cron every 60 seconds. See Section 7.2 for the full flow.

**Security:** Vercel sets a `CRON_SECRET` header on cron requests. The route MUST verify this matches the `CRON_SECRET` environment variable. Reject all other callers with 401.

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/close-auctions",
    "schedule": "* * * * *"
  }]
}
```

### `POST /api/stripe/webhook`

Receives Stripe webhook events. See Section 7.3.

**Security:** Verify the `stripe-signature` header using `stripe.webhooks.constructEvent()`. Reject invalid signatures with 400.

---

## 10. File Structure

```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout: fonts, dark mode, Providers wrapper
│   │   ├── page.tsx                        # Home page (RSC): featured auction hero + auction grid
│   │   ├── globals.css                     # Tailwind imports + CSS custom properties
│   │   │
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx                # Login page: magic link form + Google OAuth button
│   │   │   └── callback/
│   │   │       └── route.ts                # GET handler: exchanges auth code for session, redirects
│   │   │
│   │   ├── auctions/
│   │   │   └── [slug]/
│   │   │       └── page.tsx                # Auction detail page (RSC shell + BiddingRoom client)
│   │   │
│   │   ├── account/
│   │   │   └── page.tsx                    # Profile page: name, email, payment method management
│   │   │
│   │   └── api/
│   │       ├── cron/
│   │       │   └── close-auctions/
│   │       │       └── route.ts            # Vercel cron: close expired auctions, charge winners
│   │       └── stripe/
│   │           └── webhook/
│   │               └── route.ts            # Stripe webhook handler
│   │
│   ├── components/
│   │   ├── ui/                             # shadcn/ui primitives (button, card, input, badge, etc.)
│   │   │
│   │   ├── providers.tsx                   # Client component: wraps children with any context providers
│   │   ├── navbar.tsx                      # Client component: navigation, auth state, user menu
│   │   │
│   │   ├── auction-card.tsx                # Server component: single auction card for grid display
│   │   ├── auction-grid.tsx                # Server component: grid of auction cards
│   │   ├── featured-auction.tsx            # Server component: hero section for featured auction
│   │   │
│   │   ├── bidding-room.tsx                # Client component: orchestrates the entire bidding experience
│   │   ├── bid-feed.tsx                    # Client component: scrollable list of bids, animated entries
│   │   ├── bid-form.tsx                    # Client component: quick-bid buttons + custom amount input
│   │   ├── countdown-timer.tsx             # Client component: live countdown with popcorn extension
│   │   ├── auction-status-banner.tsx       # Client component: shows "You're the highest bidder!" etc.
│   │   │
│   │   ├── login-form.tsx                  # Client component: magic link email input + OAuth buttons
│   │   ├── payment-form.tsx                # Client component: Stripe PaymentElement for card setup
│   │   └── profile-form.tsx                # Client component: name edit form
│   │
│   ├── actions/
│   │   ├── bid.ts                          # placeBid server action
│   │   ├── auth.ts                         # signInWithMagicLink, signInWithGoogle, signOut
│   │   ├── payment.ts                      # createSetupIntent, confirmPaymentMethod
│   │   └── profile.ts                      # updateProfile
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # createBrowserClient() — for Client Components
│   │   │   ├── server.ts                   # createServerClient() — for RSC/Server Actions (reads cookies)
│   │   │   ├── admin.ts                    # createAdminClient() — service role, for cron/webhooks only
│   │   │   └── middleware.ts               # refreshes auth token on every request
│   │   ├── stripe.ts                       # new Stripe(secret_key) — server-only
│   │   ├── utils.ts                        # formatCurrency(cents), formatTimeLeft(date), cn()
│   │   └── constants.ts                    # POPCORN_WINDOW_MS, MIN_BID_INCREMENT, etc.
│   │
│   ├── hooks/
│   │   ├── use-realtime-bids.ts            # Subscribes to bids INSERT, returns live bid array
│   │   ├── use-realtime-auction.ts         # Subscribes to auctions UPDATE, returns live auction state
│   │   └── use-countdown.ts               # Countdown timer hook, takes end_time, returns display string
│   │
│   └── types/
│       └── database.ts                     # Generated by `supabase gen types typescript`
│
├── supabase/
│   ├── config.toml                         # Supabase local dev config
│   └── migrations/
│       └── 00001_initial_schema.sql        # Full schema, indexes, functions, triggers, RLS, realtime config
│
├── public/
│   ├── og-image.png                        # Open Graph image for social sharing
│   └── favicon.ico
│
├── middleware.ts                            # Next.js middleware: refreshes Supabase auth on every request
├── vercel.json                             # Cron job configuration
├── .env.local.example                      # Template for environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── prd.md                                  # This file
```

### 10.1 File Roles — Hard Rules

- **Server Components** (default in App Router): `page.tsx` files, `auction-card.tsx`, `auction-grid.tsx`, `featured-auction.tsx`. These fetch data and render HTML. No `useState`, no `useEffect`, no `"use client"`.
- **Client Components** (marked `"use client"`): Everything in `components/` that handles interactivity — forms, timers, realtime subscriptions, animations. They receive initial data as props from Server Components.
- **Server Actions** (marked `"use server"`): Files in `actions/`. Called from Client Components via form actions or direct invocation. They run on the server, have access to cookies (for auth), and can call Supabase/Stripe server SDKs.
- **API Routes** (`route.ts`): Only for external callers that can't use Server Actions — Vercel cron and Stripe webhooks.
- **Hooks** (`hooks/`): Custom React hooks for Client Components. Encapsulate Supabase Realtime subscriptions and timer logic.

---

## 11. Component Architecture & Data Flow

### 11.1 Home Page (`/`)

```
page.tsx (RSC)
  ├── Fetch featured auction (supabase.from('auctions').select().eq('featured', true).single())
  ├── Fetch active auctions (supabase.from('auctions').select().eq('status', 'active').order('end_time'))
  │
  ├── <FeaturedAuction auction={featured} />        ← RSC, hero with countdown
  └── <AuctionGrid auctions={active} />             ← RSC, responsive grid
        └── <AuctionCard auction={auction} />        ← RSC, individual card
              └── <CountdownTimer endTime={auction.end_time} />  ← Client, live countdown
```

The home page is almost entirely server-rendered. The only Client Component is `CountdownTimer` (a small island of interactivity ticking down in real-time). This means the page loads fast, is fully SEO-indexable, and has minimal JavaScript.

### 11.2 Auction Detail Page (`/auctions/[slug]`)

```
page.tsx (RSC)
  ├── Fetch auction by slug
  ├── Fetch top 50 bids for this auction, joined with users.name
  ├── Fetch current user (if authenticated)
  │
  └── <BiddingRoom                                  ← Client Component (the "island")
        auction={auction}
        initialBids={bids}
        currentUser={user}
      />
        ├── useRealtimeAuction(auction.id)          ← hook: live auction state (timer, status)
        ├── useRealtimeBids(auction.id)             ← hook: live bid feed
        ├── useCountdown(auction.end_time)          ← hook: display countdown
        │
        ├── <AuctionStatusBanner />                 ← "You're winning!" / "Outbid!" / "Auction ended"
        ├── <CountdownTimer />                      ← large countdown display
        ├── <BidFeed bids={bids} />                 ← scrollable list, animated new entries
        │     └── Each bid: bidder name, amount, timestamp
        └── <BidForm />                             ← quick-bid buttons + custom input
              ├── Quick bid: current + $100, current + $500, current + $1000
              ├── Custom amount input (validated client-side first, server-authoritative)
              └── If no payment method: shows "Add payment method" CTA instead
```

**Data flow on a new bid:**
1. User clicks a quick-bid button or submits custom amount
2. `BidForm` calls `placeBid` server action with (auctionId, amount)
3. Server action calls `supabase.rpc('place_bid', ...)` via the user's JWT
4. `place_bid()` atomically validates + inserts + updates
5. Supabase Realtime broadcasts:
   - `INSERT` on `bids` table → `useRealtimeBids` hook receives it → bid feed updates with animation
   - `UPDATE` on `auctions` table → `useRealtimeAuction` hook receives it → timer and max bid update
6. ALL connected clients see the new bid and updated timer simultaneously

**Optimistic updates:** The submitting client can optimistically add the bid to the feed before the WebSocket confirms it. If the server action returns an error, roll back the optimistic update and show the error message.

### 11.3 Account Page (`/account`)

```
page.tsx (RSC)
  ├── Fetch current user (redirect to /auth/login if not authenticated)
  ├── Fetch user profile from users table
  │
  ├── <ProfileForm user={user} />                   ← Client: edit name
  └── <PaymentForm user={user} />                   ← Client: add/manage payment method
        ├── If has_payment_method: show "Card on file ✓" + "Update" button
        └── If no payment method: show Stripe PaymentElement
```

### 11.4 Login Page (`/auth/login`)

```
page.tsx (RSC)
  └── <LoginForm />                                 ← Client Component
        ├── Email input + "Send Magic Link" button
        ├── Divider: "or"
        ├── "Continue with Google" button
        └── Success state: "Check your email for a login link"
```

---

## 12. Real-Time Subscription Design

### 12.1 `useRealtimeBids(auctionId)`

```typescript
// Subscribes to: INSERT on public.bids WHERE auction_id = auctionId
// On event: prepend new bid to state array, cap at 50 items
// Joins user name from the payload's user_id (query on receipt, or denormalize)
// Cleanup: unsubscribe on unmount or auctionId change
```

**Important:** Supabase Realtime INSERT payloads include the full new row. However, they do NOT include joined data (like the bidder's name). Two approaches:
- **Option A (recommended for MVP):** When a new bid arrives via WebSocket, look up the user's name from a local map (populated from the initial bids fetch). If unknown, query the user. This avoids an extra DB column.
- **Option B:** Denormalize `bidder_name` onto the `bids` table. Simpler reads, but violates normalization. Acceptable if performance matters.

Go with **Option A** for MVP. Maintain a `Map<userId, userName>` in the BiddingRoom component, populated from initial data and expanded as new bidders appear.

### 12.2 `useRealtimeAuction(auctionId)`

```typescript
// Subscribes to: UPDATE on public.auctions WHERE id = auctionId
// On event: update local auction state (end_time, current_max_bid, bid_count, status)
// This is how all clients learn about:
//   - Popcorn timer extensions (end_time changed)
//   - Auction closing (status → 'closed', winner_id set)
// Cleanup: unsubscribe on unmount
```

### 12.3 Channel Strategy

Use a single Supabase channel per auction page:

```typescript
const channel = supabase.channel(`auction:${auctionId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `auction_id=eq.${auctionId}` }, handleNewBid)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` }, handleAuctionUpdate)
  .subscribe();
```

One channel, two listeners. Clean setup, one teardown.

---

## 13. Countdown Timer & Popcorn Bidding

### 13.1 Client-Side Timer

The `useCountdown` hook:
- Takes `endTime: string` (ISO timestamp from the auction)
- Runs `setInterval` every 1000ms
- Computes `remaining = new Date(endTime).getTime() - Date.now()`
- Returns `{ days, hours, minutes, seconds, isExpired, isUrgent }`
- `isUrgent` = true when < 5 minutes remain (triggers visual change — red text, pulse animation)
- When `isExpired` flips to true, the bid form disables

### 13.2 Timer Sync

The `endTime` prop comes from the auction state, which is updated in real-time via `useRealtimeAuction`. When a popcorn extension happens:
1. `place_bid()` extends `end_time` in the DB
2. Supabase Realtime fires an UPDATE event
3. `useRealtimeAuction` receives the new `end_time`
4. Parent component passes the new `endTime` to `useCountdown`
5. The timer resets to the new deadline — all clients, simultaneously

No client-side timer manipulation. The database is the single source of truth for the deadline.

### 13.3 Visual Behavior

| State | Visual Treatment |
|---|---|
| > 1 hour remaining | Show `Xh Ym` in neutral color |
| 5 min – 1 hour | Show `Xm Ys` |
| < 5 minutes | Show `Xm Ys` in red, pulse animation |
| Popcorn extension fires | Brief flash/bounce animation on timer to signal extension |
| Expired | Show "Auction Ended", disable bid form |

---

## 14. UI & Design System

### 14.1 Design Principles

- **Dark mode first.** The default (and only, for MVP) is a dark theme. Premium feel, like a high-end auction house at night.
- **Typography-driven.** Use a clean sans-serif (Inter or Geist). Bid amounts should be large and prominent. Use tabular numbers (`font-variant-numeric: tabular-nums`) so digits don't jump when amounts change.
- **Whitespace is luxury.** Generous padding, no crowding. Let the auction content breathe.
- **Motion with purpose.** Animate new bids sliding into the feed. Pulse the timer when urgent. Don't animate decoratively.

### 14.2 shadcn/ui Components to Install

```bash
npx shadcn@latest add button card input badge avatar separator skeleton toast dialog
```

These provide the primitives. Everything else is composed from them.

### 14.3 Color System (CSS Custom Properties)

Use shadcn's dark theme defaults, with one addition:

```css
--bid-highlight: hsl(142, 71%, 45%);    /* Green — "new bid" flash */
--urgent: hsl(0, 72%, 51%);             /* Red — timer < 5 min */
--winning: hsl(142, 71%, 45%);          /* Green — "you're winning" */
--outbid: hsl(0, 72%, 51%);             /* Red — "you've been outbid" */
```

### 14.4 Responsive Breakpoints

- **Mobile (< 768px):** Single column. Bid feed above bid form. Timer prominent at top.
- **Desktop (>= 768px):** Two-column layout in the bidding room. Left: auction info + bid feed. Right: sticky bid form + timer.

---

## 15. Authentication Flow

### 15.1 Magic Link

1. User enters email on `/auth/login`
2. Server action calls `supabase.auth.signInWithOtp({ email })`
3. Supabase sends a magic link email
4. User clicks link → redirected to `/auth/callback?code=...`
5. `/auth/callback/route.ts` exchanges the code for a session via `supabase.auth.exchangeCodeForSession(code)`
6. Redirect to `/` (or the page they were trying to access)

### 15.2 Google OAuth

1. User clicks "Continue with Google"
2. Server action calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Returns OAuth URL → client redirects
4. After Google auth, Supabase redirects to `/auth/callback`
5. Same code exchange flow as magic link

### 15.3 Middleware

`middleware.ts` at the project root:
- Runs on every request
- Refreshes the Supabase session (exchanges refresh token if expired)
- Required because Supabase auth tokens expire and the middleware ensures Server Components always see a fresh session

### 15.4 Protected Routes

Only `/account` is fully protected (redirect to login if no session). The bidding room is NOT protected — anyone can view. But the bid form checks auth state and shows "Sign in to bid" if unauthenticated.

---

## 16. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-only. Never expose to client.

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...                  # Server-only
STRIPE_WEBHOOK_SECRET=whsec_...           # Server-only

# Vercel Cron
CRON_SECRET=...                           # Vercel sets this automatically

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Used for auth redirects
```

**Critical security rule:** Any variable without `NEXT_PUBLIC_` prefix MUST NOT be imported in Client Components or any file that doesn't begin with `"use server"` or is a `route.ts`.

---

## 17. Error Handling Strategy

### 17.1 Bid Errors (the only high-stakes path)

| Error from `place_bid()` | User-Facing Message | UI Behavior |
|---|---|---|
| `"Not authenticated"` | "Please sign in to place a bid" | Show login CTA |
| `"Payment method required"` | "Add a payment method to start bidding" | Link to /account |
| `"Auction not found"` | "This auction no longer exists" | Redirect to home |
| `"Auction is not active"` | "This auction has ended" | Disable bid form, show results |
| `"Auction has ended"` | "This auction has ended" | Same as above |
| `"Bid must be at least..."` | "Someone just outbid you! The minimum bid is now $X" | Update form minimum, shake animation |

### 17.2 General Strategy

- **Toast notifications** for transient feedback (bid placed, bid error, payment saved).
- **No retry logic** in the client. If a bid fails, show the error and let the user retry manually.
- **No loading spinners on the bidding form.** Use `useTransition` to disable the button while the server action is in flight, but keep the UI responsive.

---

## 18. Build Phases

This replaces the original "Weekend Execution Plan" with a dependency-aware sequence. Each phase produces a testable deliverable. Do not start a phase until the previous one is verified.

### Phase 1: Foundation
**Deliverable:** Skeleton app with auth that you can sign into.

1. `create-next-app` with TypeScript, Tailwind, App Router, `src/` directory
2. Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, `framer-motion`
3. Install shadcn/ui and required components (button, card, input, badge, avatar, separator, skeleton, toast, dialog)
4. Set up Supabase project (dashboard or CLI)
5. Write and apply the full migration (`00001_initial_schema.sql`): tables, enums, indexes, functions, triggers, RLS, replica identity
6. Run `supabase gen types typescript --project-id=xxx > src/types/database.ts`
7. Create Supabase client utilities (`lib/supabase/client.ts`, `server.ts`, `admin.ts`, `middleware.ts`)
8. Create `middleware.ts` at project root for auth session refresh
9. Build the auth flow: login page, callback route, sign-out action
10. Create root layout with dark theme, fonts, and a minimal navbar showing auth state
11. **Test:** Sign in with magic link, see your session, sign out

### Phase 2: Auction Display
**Deliverable:** Home page showing real auction data, clickable into detail pages.

1. Seed the database with 3-5 test auctions (SQL INSERT via Supabase Studio)
2. Build `auction-card.tsx` and `auction-grid.tsx` server components
3. Build `featured-auction.tsx` server component
4. Build the home page (`app/page.tsx`) fetching and rendering auctions
5. Build `countdown-timer.tsx` client component with the `useCountdown` hook
6. Build the auction detail page (`app/auctions/[slug]/page.tsx`) — server shell that fetches auction + bids
7. **Test:** Navigate the home page, click into an auction, see countdown ticking live

### Phase 3: Bidding (The Core)
**Deliverable:** Real-time bidding works between multiple browser windows.

1. Build the `bidding-room.tsx` client component
2. Build `bid-feed.tsx` with Framer Motion entry animations
3. Build `bid-form.tsx` with quick-bid buttons and custom input
4. Build `auction-status-banner.tsx`
5. Write the `placeBid` server action
6. Build the realtime hooks: `useRealtimeBids`, `useRealtimeAuction`
7. Wire everything together in the bidding room
8. **Test:** Open two browser windows logged in as different users. Place bids. Verify:
   - Both windows see the bid in real-time
   - `current_max_bid` updates
   - Bid validation works (can't bid below minimum)
   - Popcorn extension fires when bidding in last 5 minutes (temporarily set an auction's `end_time` to 3 minutes from now)

### Phase 4: Payments
**Deliverable:** Users can save a card and the system can charge winners.

1. Create Stripe account, get API keys
2. Build `lib/stripe.ts` server utility
3. Build `createSetupIntent` and `confirmPaymentMethod` server actions
4. Build `payment-form.tsx` with Stripe PaymentElement
5. Build the account page (`app/account/page.tsx`) with profile and payment management
6. Gate the bid form: if `!has_payment_method`, show "Add payment method" instead of bid buttons
7. Build the cron route (`api/cron/close-auctions/route.ts`)
8. Build the Stripe webhook route (`api/stripe/webhook/route.ts`)
9. Configure `vercel.json` with the cron schedule
10. **Test:** Add a card (use Stripe test card `4242...`). Place a bid. Manually set an auction's `end_time` to 1 minute from now. Wait for cron to fire. Verify payment captured in Stripe dashboard.

### Phase 5: Polish & Deploy
**Deliverable:** Production-ready, deployed to Vercel.

1. Responsive design pass: test every page at mobile (375px) and desktop (1440px)
2. Add loading skeletons for server component data fetches
3. Add Open Graph metadata for social sharing
4. Add `robots.txt` and basic SEO meta tags
5. Final Tailwind styling pass: spacing, typography, hover states, focus rings
6. Deploy to Vercel, configure environment variables
7. Set Supabase project's Site URL to the production domain
8. Configure Stripe webhook endpoint to the production URL
9. Seed production database with initial auctions
10. **Test:** Full flow on production: sign up, add card, place bid, watch real-time, verify auction close

---

## 19. Seed Data Structure

For development and initial launch, insert auctions directly via SQL:

```sql
INSERT INTO auctions (slug, celebrity_name, celebrity_title, description, charity_name, charity_website, image_url, starting_price, min_increment, end_time, original_end_time, featured)
VALUES
  ('dinner-with-tim-cook', 'Tim Cook', 'CEO of Apple', 'An exclusive dinner at a Michelin-star restaurant in Cupertino...', 'Product Red', 'https://red.org', 'https://images.unsplash.com/...', 50000, 5000, now() + interval '3 days', now() + interval '3 days', true),
  ('coffee-with-sara-blakely', 'Sara Blakely', 'Founder of Spanx', 'A 1-hour coffee chat about entrepreneurship...', 'Sara Blakely Foundation', 'https://sarablakely.com/foundation', 'https://images.unsplash.com/...', 10000, 1000, now() + interval '5 days', now() + interval '5 days', false),
  ('coaching-with-alex-hormozi', 'Alex Hormozi', 'Founder of Acquisition.com', 'A 90-minute strategy session...', 'Pencils of Promise', 'https://pencilsofpromise.org', 'https://images.unsplash.com/...', 25000, 2500, now() + interval '7 days', now() + interval '7 days', false);
```

---

## 20. Edge Cases & Guardrails

| Scenario | Handling |
|---|---|
| Two bids arrive at the exact same millisecond | `SELECT FOR UPDATE` in `place_bid()` serializes them. One wins, one gets "Bid must be at least..." error |
| User bids on their own winning bid (re-bidding when already highest) | Allowed. Some auction platforms prevent this, but for charity it's fine — they're donating more. Can be restricted in V2 if needed |
| Auction has zero bids when it closes | Cron closes the auction with `winner_id = NULL`. No payment attempted. Status becomes `closed` |
| Winner's card declines | Cron logs the error. Auction still closes. Admin handles manually (contact runner-up or re-open). V2: automated runner-up fallback |
| User deletes their payment method via Stripe dashboard | `has_payment_method` is now stale. `place_bid()` doesn't check Stripe — it checks the boolean. Fix: Stripe webhook on `customer.deleted` / `payment_method.detached` to set `has_payment_method = false`. Defer to V2 — low probability for MVP |
| User opens the page and their clock is wrong | Timer appears wrong locally but the bid form's validation is server-side. They might see "3 minutes left" when it's actually 30 seconds, but the bid will fail server-side if the auction has actually ended. Acceptable for MVP |
| User rapidly clicks bid button multiple times | Disable the button during server action flight via `useTransition`. The `SELECT FOR UPDATE` in `place_bid()` also serializes rapid-fire bids from the same user — second bid will fail if amount is now too low |
| WebSocket disconnects (user loses internet) | Supabase client reconnects automatically. On reconnect, stale bids may be missed. Mitigation: when `useRealtimeAuction` reconnects, refetch the latest auction state and top bids to resync. Add a `status: "reconnecting"` indicator in the UI |
| Cron job runs while an auction is in its popcorn extension window | The cron checks `end_time < now()`. If a bid extended the timer, `end_time` is in the future and the cron skips it. Correct behavior |
| Multiple cron invocations race on the same auction | Use `UPDATE ... SET status = 'closed' WHERE id = X AND status = 'active' RETURNING *`. If 0 rows returned, another invocation already closed it. Skip |

---

## 21. Package Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "stripe": "^17",
    "@stripe/stripe-js": "^5",
    "@stripe/react-stripe-js": "^3",
    "framer-motion": "^12",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^3",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^19",
    "@types/node": "^22",
    "tailwindcss": "^4",
    "supabase": "^2"
  }
}
```

---

## 22. V2 Roadmap (Out of Scope for MVP)

Listed here so V1 architecture doesn't accidentally block these. None of these should be built now, but the schema and patterns should not make them impossible.

1. **Stripe Connect** — Automated payout splits directly to charity Stripe accounts. Requires adding `charity_stripe_account_id` to auctions.
2. **Email notifications** — "You've been outbid!", "You won!", "Auction starting soon". Use Supabase Edge Functions or Resend.
3. **Admin dashboard** — Create/edit/feature auctions, view payment status, manage users. Protected by admin role check.
4. **Auction scheduling** — `start_time` column, `scheduled` status. Cron transitions `scheduled → active` when `start_time <= now()`.
5. **Celebrity profiles** — Separate `celebrities` table with bio, photo, social links. Auctions reference `celebrity_id` instead of denormalized name/title.
6. **Charity profiles** — Separate `charities` table with description, logo, EIN, verification status.
7. **Bid history page** — User's complete bidding history across all auctions.
8. **Runner-up fallback** — If winner's payment fails, automatically offer the win to the second-highest bidder.
9. **Mobile app** — React Native or Expo, sharing the same Supabase backend.
10. **Analytics** — Track auction performance, conversion rates, average bid sizes.

---

## Appendix A: Key Architectural Decisions Log

| Decision | Rationale |
|---|---|
| All bid logic in a Postgres function, not application code | Atomicity via `SELECT FOR UPDATE` prevents race conditions. No amount of application-layer locking can match database-level serialization |
| `SECURITY DEFINER` function + no RLS INSERT on bids | The function IS the API. Direct table access is blocked. One door in, fully validated |
| Return JSONB from `place_bid()` instead of raising exceptions | Supabase RPC surfaces exceptions as opaque 400 errors. JSONB gives structured errors the client can parse and display |
| `has_payment_method` denormalized on users table | Avoids a Stripe API call on every bid attempt. Slightly stale in edge cases (user removes card via Stripe dashboard), acceptable for MVP |
| Popcorn extension handled in `place_bid()`, not a separate trigger | Keeps all bid-time logic in one transaction. The extension is a side effect of a valid bid, not an independent event |
| Single Supabase Realtime channel per auction page | Simpler subscription management. One channel, two listeners (bids INSERT + auctions UPDATE). One cleanup |
| No global state library | React state + server props + WebSocket events cover all cases. Adding Zustand/Redux would be premature complexity with zero benefit for this app |
| Dark mode only for MVP | Avoids doubling the design work. A premium dark theme is the right aesthetic for this product. Light mode is a V2 cosmetic addition |
| Slugs for auction URLs instead of UUIDs | `/auctions/dinner-with-tim-cook` is shareable and SEO-friendly. UUIDs in URLs look broken |
| Amounts stored in cents as integers | Standard practice. Avoids floating-point precision issues. Display layer divides by 100 |
