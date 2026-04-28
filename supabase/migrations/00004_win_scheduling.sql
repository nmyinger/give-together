-- ============================================================
-- CharityBid: Win Scheduling & Notifications
-- ============================================================

-- ============================================================
-- WIN SCHEDULING — winner provides availability for the experience
-- ============================================================

CREATE TABLE public.win_scheduling (
  id              uuid        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id      uuid        NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  winner_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_email   text,
  contact_phone   text,
  availability    text        NOT NULL DEFAULT '',  -- free text: preferred dates, times, timezone
  timezone        text,
  notes           text,
  status          text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  admin_notes     text,
  scheduled_for   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auction_id)
);

ALTER TABLE public.win_scheduling ENABLE ROW LEVEL SECURITY;

-- Winners can read and manage their own scheduling
CREATE POLICY "Winners can manage own scheduling"
  ON public.win_scheduling FOR ALL
  USING (auth.uid() = winner_id)
  WITH CHECK (auth.uid() = winner_id);

CREATE INDEX idx_win_scheduling_winner  ON public.win_scheduling (winner_id);
CREATE INDEX idx_win_scheduling_status  ON public.win_scheduling (status);

CREATE TRIGGER set_win_scheduling_updated_at
  BEFORE UPDATE ON public.win_scheduling
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NOTIFICATION LOG — tracks emails sent (prevents duplicates)
-- ============================================================

CREATE TABLE public.notification_log (
  id          uuid        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL,  -- 'winner', 'outbid', 'payment_failed', 'welcome'
  user_id     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  auction_id  uuid        REFERENCES public.auctions(id) ON DELETE SET NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  metadata    jsonb,
  UNIQUE(type, user_id, auction_id)
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
-- No RLS policies — only readable/writable via service role in API routes
