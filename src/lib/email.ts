import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? 'CharityBid <noreply@charitybid.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://charitybid.com'

function formatDollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

async function logAndSend(
  supabaseAdmin: ReturnType<typeof import('./supabase/admin').createAdminClient>,
  logKey: { type: string; user_id: string | null; auction_id: string | null },
  emailPayload: Parameters<typeof resend.emails.send>[0]
) {
  // Deduplication: skip if already sent
  const { error: logError } = await supabaseAdmin
    .from('notification_log')
    .insert({ ...logKey, metadata: { to: emailPayload.to } })

  if (logError) {
    // UNIQUE constraint violated — already sent
    if (logError.code === '23505') return { skipped: true }
    console.error('[email] Log insert error:', logError)
  }

  const { error } = await resend.emails.send(emailPayload)
  if (error) console.error('[email] Send error:', error)
  return { skipped: false }
}

export async function sendWinnerEmail(
  supabaseAdmin: ReturnType<typeof import('./supabase/admin').createAdminClient>,
  opts: {
    winnerEmail: string
    winnerName: string
    auctionName: string
    charityName: string
    amount: number
    auctionSlug: string
    userId: string
    auctionId: string
  }
) {
  const scheduleUrl = `${APP_URL}/auctions/${opts.auctionSlug}`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1e2d5a;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.6);font-weight:600;">CharityBid</p>
      <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#ffffff;">You won! 🎉</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Hi ${opts.winnerName || 'there'},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
        Congratulations — you won the <strong>${opts.auctionName}</strong> auction with a winning bid of <strong style="color:#b38a00;">${formatDollars(opts.amount)}</strong>. Your card has been charged and 100% goes to <strong>${opts.charityName}</strong>.
      </p>
      <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px 24px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#1e40af;">Next step</p>
        <p style="margin:0;font-size:15px;color:#1e3a6b;line-height:1.6;">
          Visit the auction page to schedule your experience. We'll coordinate timing that works for everyone.
        </p>
      </div>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${scheduleUrl}" style="display:inline-block;background:#1e2d5a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;">Schedule your experience →</a>
      </div>
      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
        Questions? Reply to this email and we'll get back to you within one business day.
      </p>
    </div>
    <div style="background:#f9f6f1;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">100% of proceeds go to charity · Secure payments by Stripe</p>
    </div>
  </div>
</body>
</html>`

  return logAndSend(supabaseAdmin, { type: 'winner', user_id: opts.userId, auction_id: opts.auctionId }, {
    from: FROM,
    to: opts.winnerEmail,
    subject: `You won: ${opts.auctionName} — CharityBid`,
    html,
  })
}

export async function sendOutbidEmail(
  supabaseAdmin: ReturnType<typeof import('./supabase/admin').createAdminClient>,
  opts: {
    loserEmail: string
    loserName: string
    auctionName: string
    newBid: number
    minNextBid: number
    auctionSlug: string
    userId: string
    auctionId: string
  }
) {
  const bidUrl = `${APP_URL}/auctions/${opts.auctionSlug}`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#7f1d1d;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.6);font-weight:600;">CharityBid</p>
      <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#ffffff;">You've been outbid</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Hi ${opts.loserName || 'there'},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
        Someone just placed a bid of <strong style="color:#b38a00;">${formatDollars(opts.newBid)}</strong> on <strong>${opts.auctionName}</strong>. You're no longer the leading bidder.
      </p>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${bidUrl}" style="display:inline-block;background:#1e2d5a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;">Bid ${formatDollars(opts.minNextBid)} or more →</a>
      </div>
      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
        Tip: set up a proxy bid on the auction page and we'll automatically counter-bid on your behalf up to your maximum.
      </p>
    </div>
    <div style="background:#f9f6f1;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">100% of proceeds go to charity · Secure payments by Stripe</p>
    </div>
  </div>
</body>
</html>`

  return logAndSend(supabaseAdmin, { type: 'outbid', user_id: opts.userId, auction_id: opts.auctionId }, {
    from: FROM,
    to: opts.loserEmail,
    subject: `You've been outbid on ${opts.auctionName} — CharityBid`,
    html,
  })
}

export async function sendPaymentFailedEmail(
  supabaseAdmin: ReturnType<typeof import('./supabase/admin').createAdminClient>,
  opts: {
    winnerEmail: string
    winnerName: string
    auctionName: string
    amount: number
    userId: string
    auctionId: string
  }
) {
  const updateUrl = `${APP_URL}/account`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#92400e;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.6);font-weight:600;">CharityBid</p>
      <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#ffffff;">Payment issue</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Hi ${opts.winnerName || 'there'},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
        You won the <strong>${opts.auctionName}</strong> auction with a bid of <strong style="color:#b38a00;">${formatDollars(opts.amount)}</strong>, but we were unable to process your payment.
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px 24px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#92400e;">Action required</p>
        <p style="margin:0;font-size:15px;color:#78350f;line-height:1.6;">
          Please update your payment method in your account settings. Once updated, reply to this email and we'll process your payment manually.
        </p>
      </div>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${updateUrl}" style="display:inline-block;background:#1e2d5a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;">Update payment method →</a>
      </div>
      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
        Your winner status is reserved. Reply to this email within 48 hours to complete your purchase.
      </p>
    </div>
    <div style="background:#f9f6f1;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">100% of proceeds go to charity · Secure payments by Stripe</p>
    </div>
  </div>
</body>
</html>`

  return logAndSend(supabaseAdmin, { type: 'payment_failed', user_id: opts.userId, auction_id: opts.auctionId }, {
    from: FROM,
    to: opts.winnerEmail,
    subject: `Payment issue for ${opts.auctionName} — CharityBid`,
    html,
  })
}

export async function sendWelcomeEmail(opts: { email: string; name: string }) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1e2d5a;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.6);font-weight:600;">CharityBid</p>
      <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#ffffff;">Welcome aboard</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Hi ${opts.name || 'there'},</p>
      <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
        You're now on CharityBid — the platform where every bid goes toward a cause that matters. Browse exclusive experiences with remarkable people, bid, and when you win, we handle the rest.
      </p>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${APP_URL}" style="display:inline-block;background:#1e2d5a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;">Browse auctions →</a>
      </div>
    </div>
    <div style="background:#f9f6f1;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">100% of proceeds go to charity · Secure payments by Stripe</p>
    </div>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: 'Welcome to CharityBid',
    html,
  })
  if (error) console.error('[email] Welcome send error:', error)
}
