-- ============================================================
-- CharityBid: Initial Schema
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE auction_status AS ENUM ('active', 'closed');

-- ============================================================
-- TABLES
-- ============================================================

-- Extends auth.users — created automatically via trigger
CREATE TABLE public.users (
  id               uuid        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text        NOT NULL DEFAULT '',
  avatar_url       text,
  stripe_customer_id text      UNIQUE,
  has_payment_method boolean   NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.auctions (
  id                uuid           NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text           NOT NULL UNIQUE,
  celebrity_name    text           NOT NULL,
  celebrity_title   text           NOT NULL,
  description       text           NOT NULL,
  charity_name      text           NOT NULL,
  charity_website   text,
  image_url         text           NOT NULL,
  starting_price    integer        NOT NULL DEFAULT 10000,  -- in cents ($100)
  min_increment     integer        NOT NULL DEFAULT 1000,   -- in cents ($10)
  current_max_bid   integer        NOT NULL DEFAULT 0,
  bid_count         integer        NOT NULL DEFAULT 0,
  end_time          timestamptz    NOT NULL,
  original_end_time timestamptz    NOT NULL,
  status            auction_status NOT NULL DEFAULT 'active',
  winner_id         uuid           REFERENCES public.users(id),
  winning_bid_id    uuid,          -- FK added after bids table is created
  featured          boolean        NOT NULL DEFAULT false,
  payment_intent_id text,
  created_at        timestamptz    NOT NULL DEFAULT now()
);

CREATE TABLE public.bids (
  id         uuid        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid        NOT NULL REFERENCES public.auctions(id),
  user_id    uuid        NOT NULL REFERENCES public.users(id),
  amount     integer     NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add the self-referential FK now that bids exists
ALTER TABLE public.auctions
  ADD CONSTRAINT auctions_winning_bid_id_fkey
  FOREIGN KEY (winning_bid_id) REFERENCES public.bids(id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_bids_auction_amount   ON bids (auction_id, amount DESC);
CREATE INDEX idx_bids_user             ON bids (user_id, created_at DESC);
CREATE INDEX idx_auctions_active_end   ON auctions (end_time) WHERE status = 'active';
CREATE UNIQUE INDEX idx_auctions_slug  ON auctions (slug);
CREATE INDEX idx_auctions_featured     ON auctions (featured) WHERE featured = true;

-- ============================================================
-- REALTIME — REPLICA IDENTITY
-- Required so UPDATE events include all columns, not just PK
-- ============================================================

ALTER TABLE auctions REPLICA IDENTITY FULL;

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-create public profile when auth user is created
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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Maintain updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CORE FUNCTION: place_bid()
-- Atomic bid placement with full validation.
-- Uses SELECT FOR UPDATE to serialize concurrent bids.
-- SECURITY DEFINER bypasses RLS — this IS the access control.
-- ============================================================

CREATE OR REPLACE FUNCTION place_bid(
  p_auction_id uuid,
  p_amount     integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid;
  v_auction       auctions%ROWTYPE;
  v_bid           bids%ROWTYPE;
  v_has_payment   boolean;
BEGIN
  -- 1. Authenticate via JWT
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- 2. Verify payment method on file
  SELECT has_payment_method INTO v_has_payment
  FROM users WHERE id = v_user_id;

  IF NOT COALESCE(v_has_payment, false) THEN
    RETURN jsonb_build_object('error', 'Payment method required');
  END IF;

  -- 3. Lock auction row to serialize concurrent bids
  SELECT * INTO v_auction
  FROM auctions WHERE id = p_auction_id
  FOR UPDATE;

  IF NOT FOUND THEN
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
      RETURN jsonb_build_object(
        'error',
        format('Bid must be at least %s', v_auction.starting_price)
      );
    END IF;
  ELSE
    -- Subsequent bid: must exceed current max by minimum increment
    IF p_amount < v_auction.current_max_bid + v_auction.min_increment THEN
      RETURN jsonb_build_object(
        'error',
        format('Bid must be at least %s', v_auction.current_max_bid + v_auction.min_increment)
      );
    END IF;
  END IF;

  -- 5. Insert the bid
  INSERT INTO bids (auction_id, user_id, amount)
  VALUES (p_auction_id, v_user_id, p_amount)
  RETURNING * INTO v_bid;

  -- 6. Update auction: current_max_bid, bid_count, and popcorn timer extension
  UPDATE auctions
  SET
    current_max_bid = p_amount,
    bid_count       = bid_count + 1,
    end_time        = CASE
      WHEN end_time - now() < interval '5 minutes'
      THEN now() + interval '5 minutes'
      ELSE end_time
    END
  WHERE id = p_auction_id;

  -- 7. Return the new bid
  RETURN jsonb_build_object(
    'bid', jsonb_build_object(
      'id',         v_bid.id,
      'auction_id', v_bid.auction_id,
      'user_id',    v_bid.user_id,
      'amount',     v_bid.amount,
      'created_at', v_bid.created_at
    )
  );
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids     ENABLE ROW LEVEL SECURITY;

-- users: public read, self-update only, no direct insert (trigger handles it)
CREATE POLICY "Users are publicly readable"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- auctions: public read, no direct write (admin via service role / Studio)
CREATE POLICY "Auctions are publicly readable"
  ON public.auctions FOR SELECT USING (true);

-- bids: public read, NO direct insert (must go through place_bid()), no update/delete
CREATE POLICY "Bids are publicly readable"
  ON public.bids FOR SELECT USING (true);

-- ============================================================
-- REALTIME: enable publications
-- ============================================================

-- These tables broadcast changes to subscribed clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;

-- ============================================================
-- SEED DATA (development/demo)
-- ============================================================

INSERT INTO public.auctions (
  slug, celebrity_name, celebrity_title, description,
  charity_name, charity_website, image_url,
  starting_price, min_increment, end_time, original_end_time, featured
) VALUES
(
  'dinner-with-sara-blakely',
  'Sara Blakely',
  'Founder of Spanx',
  'Join Sara for an exclusive dinner and one-on-one conversation about building Spanx from nothing to a billion-dollar empire. Ask anything about entrepreneurship, resilience, and backing yourself when no one else will.',
  'Sara Blakely Foundation',
  'https://sarablakely.com/foundation',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
  50000,
  5000,
  now() + interval '3 days',
  now() + interval '3 days',
  true
),
(
  'coaching-with-alex-hormozi',
  'Alex Hormozi',
  'Founder of Acquisition.com',
  'A 90-minute strategy session with Alex to pressure-test your business model, pricing, and offers. He will tell you exactly what he would do if he were you — no fluff.',
  'Pencils of Promise',
  'https://pencilsofpromise.org',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  25000,
  2500,
  now() + interval '5 days',
  now() + interval '5 days',
  false
),
(
  'coffee-with-naval-ravikant',
  'Naval Ravikant',
  'Founder of AngelList',
  'One hour of coffee and conversation with Naval. Topics range freely — startups, philosophy, wealth creation, health, or whatever is on your mind. A conversation you will think about for years.',
  'GiveDirectly',
  'https://givedirectly.org',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=800',
  75000,
  7500,
  now() + interval '7 days',
  now() + interval '7 days',
  false
);
