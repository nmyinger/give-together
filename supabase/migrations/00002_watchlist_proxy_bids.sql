-- ============================================================
-- CharityBid: Watchlist & Proxy Bids
-- ============================================================

-- ============================================================
-- WATCHLIST — users can save auctions they're interested in
-- ============================================================

CREATE TABLE public.watchlist (
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, auction_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist"
  ON public.watchlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Watchlist counts are publicly readable"
  ON public.watchlist FOR SELECT USING (true);

CREATE INDEX idx_watchlist_auction ON public.watchlist (auction_id);
CREATE INDEX idx_watchlist_user    ON public.watchlist (user_id);

-- ============================================================
-- PROXY BIDS — auto-bid up to a maximum amount
-- ============================================================

CREATE TABLE public.proxy_bids (
  id         uuid        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  auction_id uuid        NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  max_amount integer     NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, auction_id)
);

ALTER TABLE public.proxy_bids ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own proxy bids (keep max hidden from others)
CREATE POLICY "Users can manage own proxy bids"
  ON public.proxy_bids FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_proxy_bids_auction ON public.proxy_bids (auction_id);

CREATE TRIGGER set_proxy_bids_updated_at
  BEFORE UPDATE ON public.proxy_bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- BIDS: add is_proxy column
-- ============================================================

ALTER TABLE public.bids ADD COLUMN is_proxy boolean NOT NULL DEFAULT false;

-- ============================================================
-- AUCTIONS: add watch_count denorm column for performance
-- ============================================================

ALTER TABLE public.auctions ADD COLUMN watch_count integer NOT NULL DEFAULT 0;

-- ============================================================
-- FUNCTION: toggle_watchlist()
-- Atomic toggle: add if not present, remove if present.
-- Returns whether the auction is now watched.
-- ============================================================

CREATE OR REPLACE FUNCTION toggle_watchlist(p_auction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exists  boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM watchlist WHERE user_id = v_user_id AND auction_id = p_auction_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM watchlist WHERE user_id = v_user_id AND auction_id = p_auction_id;
    UPDATE auctions SET watch_count = GREATEST(0, watch_count - 1) WHERE id = p_auction_id;
    RETURN jsonb_build_object('watched', false);
  ELSE
    INSERT INTO watchlist (user_id, auction_id) VALUES (v_user_id, p_auction_id)
    ON CONFLICT DO NOTHING;
    UPDATE auctions SET watch_count = watch_count + 1 WHERE id = p_auction_id;
    RETURN jsonb_build_object('watched', true);
  END IF;
END;
$$;

-- ============================================================
-- FUNCTION: upsert_proxy_bid()
-- Set or update your proxy bid max for an auction.
-- Returns the proxy bid record and triggers immediate bidding
-- if proxy max already beats current max bid.
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_proxy_bid(
  p_auction_id uuid,
  p_max_amount integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid;
  v_auction     auctions%ROWTYPE;
  v_has_payment boolean;
  v_proxy_bid   proxy_bids%ROWTYPE;
  v_min_bid     integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT has_payment_method INTO v_has_payment FROM users WHERE id = v_user_id;
  IF NOT COALESCE(v_has_payment, false) THEN
    RETURN jsonb_build_object('error', 'Payment method required');
  END IF;

  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Auction not found');
  END IF;
  IF v_auction.status != 'active' OR v_auction.end_time <= now() THEN
    RETURN jsonb_build_object('error', 'Auction is not active');
  END IF;

  -- Validate max amount is at least the minimum bid
  v_min_bid := CASE
    WHEN v_auction.current_max_bid = 0 THEN v_auction.starting_price
    ELSE v_auction.current_max_bid + v_auction.min_increment
  END;

  IF p_max_amount < v_min_bid THEN
    RETURN jsonb_build_object(
      'error',
      format('Max bid must be at least %s', v_min_bid)
    );
  END IF;

  -- Upsert proxy bid
  INSERT INTO proxy_bids (user_id, auction_id, max_amount)
  VALUES (v_user_id, p_auction_id, p_max_amount)
  ON CONFLICT (user_id, auction_id)
  DO UPDATE SET max_amount = EXCLUDED.max_amount, updated_at = now()
  RETURNING * INTO v_proxy_bid;

  -- If user's proxy max is already > current max bid and they aren't the current leader,
  -- immediately place an auto-bid at the minimum required amount
  IF v_auction.current_max_bid < p_max_amount THEN
    -- Check if they're already the current highest bidder
    IF NOT EXISTS (
      SELECT 1 FROM bids
      WHERE auction_id = p_auction_id AND user_id = v_user_id
        AND amount = v_auction.current_max_bid
    ) THEN
      -- Place immediate auto-bid
      INSERT INTO bids (auction_id, user_id, amount, is_proxy)
      VALUES (p_auction_id, v_user_id, LEAST(p_max_amount, v_min_bid), true);

      UPDATE auctions
      SET
        current_max_bid = LEAST(p_max_amount, v_min_bid),
        bid_count       = bid_count + 1,
        end_time        = CASE
          WHEN end_time - now() < interval '5 minutes'
          THEN now() + interval '5 minutes'
          ELSE end_time
        END
      WHERE id = p_auction_id;

      RETURN jsonb_build_object(
        'proxy_bid', row_to_json(v_proxy_bid),
        'auto_bid_placed', true,
        'auto_bid_amount', LEAST(p_max_amount, v_min_bid)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'proxy_bid', row_to_json(v_proxy_bid),
    'auto_bid_placed', false
  );
END;
$$;

-- ============================================================
-- Update place_bid() to trigger proxy counter-bids
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
  v_user_id         uuid;
  v_auction         auctions%ROWTYPE;
  v_bid             bids%ROWTYPE;
  v_has_payment     boolean;
  v_proxy_bid       proxy_bids%ROWTYPE;
  v_current_amount  integer;
  v_current_bidder  uuid;
  v_proxy_amount    integer;
  v_loop_count      integer := 0;
  v_total_new_bids  integer := 1;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- 2. Verify payment method
  SELECT has_payment_method INTO v_has_payment FROM users WHERE id = v_user_id;
  IF NOT COALESCE(v_has_payment, false) THEN
    RETURN jsonb_build_object('error', 'Payment method required');
  END IF;

  -- 3. Lock auction row
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Auction not found');
  END IF;
  IF v_auction.status != 'active' THEN
    RETURN jsonb_build_object('error', 'Auction is not active');
  END IF;
  IF v_auction.end_time <= now() THEN
    RETURN jsonb_build_object('error', 'Auction has ended');
  END IF;

  -- 4. Validate amount
  IF v_auction.current_max_bid = 0 THEN
    IF p_amount < v_auction.starting_price THEN
      RETURN jsonb_build_object('error', format('Bid must be at least %s', v_auction.starting_price));
    END IF;
  ELSE
    IF p_amount < v_auction.current_max_bid + v_auction.min_increment THEN
      RETURN jsonb_build_object('error', format('Bid must be at least %s', v_auction.current_max_bid + v_auction.min_increment));
    END IF;
  END IF;

  -- 5. Insert bid
  INSERT INTO bids (auction_id, user_id, amount, is_proxy)
  VALUES (p_auction_id, v_user_id, p_amount, false)
  RETURNING * INTO v_bid;

  v_current_amount := p_amount;
  v_current_bidder := v_user_id;

  -- 6. Proxy counter-bid loop (max 20 iterations to prevent runaway)
  LOOP
    EXIT WHEN v_loop_count >= 20;
    v_loop_count := v_loop_count + 1;

    -- Find the best proxy bid from a different user that can beat current amount
    SELECT pb.* INTO v_proxy_bid
    FROM proxy_bids pb
    WHERE pb.auction_id = p_auction_id
      AND pb.user_id != v_current_bidder
      AND pb.max_amount >= v_current_amount + v_auction.min_increment
    ORDER BY pb.max_amount DESC, pb.created_at ASC
    LIMIT 1;

    EXIT WHEN NOT FOUND;

    -- Place auto-bid at minimum needed to win, capped at their max
    v_proxy_amount := LEAST(
      v_proxy_bid.max_amount,
      v_current_amount + v_auction.min_increment
    );

    INSERT INTO bids (auction_id, user_id, amount, is_proxy)
    VALUES (p_auction_id, v_proxy_bid.user_id, v_proxy_amount, true);

    v_total_new_bids := v_total_new_bids + 1;
    v_current_amount := v_proxy_amount;
    v_current_bidder := v_proxy_bid.user_id;
  END LOOP;

  -- 7. Update auction with final state
  UPDATE auctions
  SET
    current_max_bid = v_current_amount,
    bid_count       = bid_count + v_total_new_bids,
    end_time        = CASE
      WHEN end_time - now() < interval '5 minutes'
      THEN now() + interval '5 minutes'
      ELSE end_time
    END
  WHERE id = p_auction_id;

  -- 8. Return
  RETURN jsonb_build_object(
    'bid', jsonb_build_object(
      'id',         v_bid.id,
      'auction_id', v_bid.auction_id,
      'user_id',    v_bid.user_id,
      'amount',     v_bid.amount,
      'created_at', v_bid.created_at
    ),
    'proxy_bids_triggered', v_total_new_bids - 1
  );
END;
$$;

-- ============================================================
-- Add toggle_watchlist and upsert_proxy_bid to the DB types
-- ============================================================

-- Realtime for watchlist (so watch counts update live)
ALTER TABLE public.watchlist REPLICA IDENTITY FULL;
