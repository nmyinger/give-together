# CharityBid — User Journeys

> Scoped to what the platform supports today (post-MVP) and the next tier of features worth building. Each journey maps to existing routes, components, and data models in the codebase. V2 aspirations live in `prd.md § 22`.

---

## Part 1: The Bidder

### 1.1 Sign Up & Sign In

- **Actor:** Unauthenticated visitor.
- **Route:** `/auth/login` → `/auth/callback`
- **Flow:**
  1. User lands on home page, clicks "Sign In" in navbar.
  2. On `/auth/login`, user enters email (magic link) or clicks "Continue with Google".
  3. Magic link: Supabase sends OTP email → user clicks link → `/auth/callback` exchanges code for session → redirect to `/`.
  4. Google OAuth: redirect to Google → back to `/auth/callback` → session set → redirect to `/`.
  5. `handle_new_user()` trigger auto-creates a `public.users` row from `auth.users`.
- **Components:** `login-form.tsx`, `/auth/callback/route.ts`, `middleware.ts` (session refresh).
- **Data:** `auth.users`, `public.users`.
- **Acceptance criteria:**
  - Magic link and Google OAuth both produce a valid session.
  - Navbar reflects authenticated state (avatar/name, sign out).
  - Repeat visits maintain session until explicit sign-out or token expiry.

### 1.2 Browse & Discover Auctions

- **Actor:** Any visitor (authenticated or not).
- **Route:** `/` (home page)
- **Flow:**
  1. Home page server-renders the featured auction hero and a grid of active auctions.
  2. Each auction card shows: celebrity name/title, charity, current bid, bid count, and a live countdown.
  3. User clicks a card → navigates to `/auctions/[slug]`.
- **Components:** `featured-auction.tsx` (RSC), `auction-grid.tsx` (RSC), `auction-card.tsx` (RSC), `countdown-timer.tsx` (client).
- **Data:** `auctions` table — `SELECT` with `status = 'active'`, ordered by `end_time`.
- **Acceptance criteria:**
  - Page loads with zero client-side data fetching (SSR).
  - Countdown timers tick live on every card.
  - Featured auction is visually distinct (hero layout).

### 1.3 Add a Payment Method

- **Actor:** Authenticated user without a card on file.
- **Route:** `/account`
- **Flow:**
  1. User navigates to `/account` (redirects to `/auth/login` if not signed in).
  2. If no payment method: Stripe `PaymentElement` is rendered.
  3. Server action `createSetupIntent()` creates a Stripe Customer (if first time) and a SetupIntent.
  4. User enters card details, submits. Stripe.js confirms the SetupIntent client-side.
  5. On success, `confirmPaymentMethod()` sets `users.has_payment_method = true`.
  6. Bid buttons across the app become active.
- **Components:** `payment-form.tsx`, `account-payment-section.tsx`, `profile-form.tsx`.
- **Actions:** `payment.ts` — `createSetupIntent()`, `confirmPaymentMethod()`.
- **Data:** `users.stripe_customer_id`, `users.has_payment_method`.
- **Acceptance criteria:**
  - SetupIntent is created with `usage: 'off_session'` (enables future off-session charges).
  - After saving a card, `has_payment_method` flips to `true` and persists across sessions.
  - If user already has a card, show "Card on file" with option to update.

### 1.4 Place a Bid (The Critical Path)

- **Actor:** Authenticated bidder with a valid payment method.
- **Route:** `/auctions/[slug]`
- **Flow:**
  1. Auction detail page server-renders the auction info, top 50 bids, and passes them to `BiddingRoom`.
  2. `BiddingRoom` subscribes to realtime via `useRealtimeBids` and `useRealtimeAuction`.
  3. User clicks a quick-bid button ($+100, $+500, $+1000) or enters a custom amount.
  4. `BidForm` calls `placeBid()` server action → RPC to `place_bid()` Postgres function.
  5. `place_bid()` atomically: validates auth, checks payment method, locks auction row (`SELECT FOR UPDATE`), validates amount against `current_max_bid + min_increment`, inserts bid, updates denormalized fields, extends timer if < 5 min remain (popcorn).
  6. Supabase Realtime broadcasts the `bids INSERT` and `auctions UPDATE` to all connected clients.
  7. All browsers see the new bid appear in the feed and the timer/max bid update simultaneously.
- **Components:** `bidding-room.tsx`, `bid-form.tsx`, `bid-feed.tsx`, `countdown-timer.tsx`, `auction-status-banner.tsx`.
- **Hooks:** `use-realtime-bids.ts`, `use-realtime-auction.ts`, `use-countdown.ts`.
- **Actions:** `bid.ts` — `placeBid()`.
- **Data:** `bids` (append-only), `auctions` (`current_max_bid`, `bid_count`, `end_time`).
- **Acceptance criteria:**
  - Concurrent bids serialize correctly — no double-wins on the same max bid.
  - Popcorn extension adds 5 minutes when a bid lands in the final 5 minutes.
  - Bid form disables during server action flight (`useTransition`).
  - If no payment method, form shows "Add payment method" CTA instead of bid buttons.
  - If auction ended, form disables and banner shows "Auction Ended".
  - Error from `place_bid()` surfaces as a user-friendly toast.

### 1.5 Win an Auction & Get Charged

- **Actor:** Highest bidder when the auction closes.
- **Route:** Background (cron) — result visible on `/auctions/[slug]`.
- **Flow:**
  1. Vercel cron hits `GET /api/cron/close-auctions` every 60 seconds.
  2. Cron queries `auctions WHERE status = 'active' AND end_time < now()`.
  3. For each expired auction with bids:
     a. Find highest bid.
     b. Look up winner's `stripe_customer_id` and default payment method.
     c. Create a `PaymentIntent` with `off_session: true, confirm: true`.
     d. On success: set `status = 'closed'`, `winner_id`, `winning_bid_id`, `payment_intent_id`.
  4. For auctions with zero bids: close with `winner_id = NULL`.
  5. Stripe webhook (`POST /api/stripe/webhook`) confirms `payment_intent.succeeded` or flags failures.
  6. Realtime broadcasts the auction UPDATE → all connected clients see "Auction Ended" with winner info.
- **API routes:** `/api/cron/close-auctions/route.ts`, `/api/stripe/webhook/route.ts`.
- **Data:** `auctions` (status, winner fields, payment_intent_id).
- **Acceptance criteria:**
  - Cron verifies `CRON_SECRET` header — rejects unauthorized callers.
  - Race-safe closure: `UPDATE ... SET status = 'closed' WHERE status = 'active' RETURNING *` prevents double-charge.
  - If payment fails, auction still closes; admin handles retry manually.
  - Webhook verifies `stripe-signature` before processing.

### 1.6 View Account & Profile

- **Actor:** Authenticated user.
- **Route:** `/account`
- **Flow:**
  1. Page shows user's name (editable), email (read-only from auth), and payment method status.
  2. `ProfileForm` calls `updateProfile()` server action to save name changes.
  3. Payment section shows current card status or the SetupIntent flow (Journey 1.3).
- **Components:** `profile-form.tsx`, `account-payment-section.tsx`, `payment-form.tsx`.
- **Actions:** `profile.ts` — `updateProfile()`.
- **Data:** `users.name`, `users.avatar_url`, `users.has_payment_method`.
- **Acceptance criteria:**
  - Name updates persist immediately.
  - Page redirects to login if session is missing.

---

## Part 2: Platform Operations (Admin — Currently Manual)

> There is no admin dashboard in the MVP. These operations happen through Supabase Studio or direct SQL. Documenting them here so the workflows are clear for the operator and for future admin UI design.

### 2.1 Create & Publish an Auction

- **Actor:** Platform operator.
- **Tool:** Supabase Studio / SQL.
- **Flow:**
  1. Insert a row into `auctions` with: `slug`, `celebrity_name`, `celebrity_title`, `description`, `charity_name`, `charity_website`, `image_url`, `starting_price`, `min_increment`, `end_time`, `original_end_time`.
  2. Set `featured = true` on exactly one auction for the home page hero.
  3. Auction goes live immediately (status defaults to `active`).
- **Data:** `auctions` table.
- **Constraints:**
  - `slug` must be unique and URL-safe.
  - `starting_price` and `min_increment` are in cents.
  - `end_time` and `original_end_time` should be set to the same value initially.

### 2.2 Monitor & Close Auctions

- **Actor:** Platform operator.
- **Tool:** Supabase Studio + Stripe Dashboard.
- **Flow:**
  1. Cron auto-closes auctions (Journey 1.5).
  2. Operator monitors Stripe dashboard for successful charges and failed payments.
  3. If a payment fails: operator contacts the winner or manually retries.
  4. If an auction needs to be extended (e.g., site outage): operator updates `end_time` directly in Supabase.
- **Data:** `auctions`, Stripe PaymentIntents.

### 2.3 Disburse Funds to Charity

- **Actor:** Platform operator / finance.
- **Tool:** Stripe Dashboard + manual bank transfer.
- **Flow:**
  1. After a successful charge, funds land in the platform's Stripe account.
  2. Operator manually wires the funds to the charity.
  3. (No receipt tracking in the system yet — tracked offline.)
- **Future:** Stripe Connect for automated splits (V2, `prd.md § 22.1`).

---

## Part 3: Cross-Cutting Concerns

### 3.1 Session Management

- `middleware.ts` runs on every request, refreshing the Supabase auth token.
- Only `/account` is a protected route (redirect to login). All other pages are publicly viewable.
- The bidding room checks auth client-side and shows "Sign in to bid" if unauthenticated.

### 3.2 Real-Time Sync

- One Supabase channel per auction page: `auction:{auctionId}`.
- Two listeners: `bids INSERT` (new bids) and `auctions UPDATE` (timer extensions, status changes).
- On WebSocket reconnect, hooks refetch latest state to fill any gaps.

### 3.3 Error States

| Scenario | Handling |
|---|---|
| Bid below minimum | Toast with updated minimum. Bid form shows new floor. |
| Bid on ended auction | Form disables. Banner shows "Auction Ended". |
| No payment method | Form replaced with "Add payment method" CTA. |
| Not signed in | Form replaced with "Sign in to bid" CTA. |
| Winner's card declines | Auction closes anyway. Operator handles manually. |
| WebSocket disconnect | Auto-reconnect + state refetch. "Reconnecting..." indicator. |
