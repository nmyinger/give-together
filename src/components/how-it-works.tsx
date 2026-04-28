const steps = [
  {
    number: '01',
    title: 'Browse auctions',
    description:
      'Discover exclusive experiences — dinners, coaching sessions, and conversations with remarkable individuals.',
  },
  {
    number: '02',
    title: 'Add a payment method',
    description:
      'Securely save a card via Stripe. You are never charged upfront — only if you win.',
  },
  {
    number: '03',
    title: 'Place your bid',
    description:
      'Bid in real time. Quick-bid buttons or a custom amount. Every bid is live — all participants see it instantly.',
  },
  {
    number: '04',
    title: 'Win, give, experience',
    description:
      'The highest bidder wins. 100% of the winning amount goes directly to the celebrity\'s chosen charity.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-4 space-y-8">
      <div className="flex items-center gap-5">
        <h2 className="font-display italic text-2xl text-foreground shrink-0">How it works</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--gold)]/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="relative rounded-xl border border-white/6 bg-white/[0.02] p-5 space-y-3 group hover:border-[var(--gold)]/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span
                className="font-display italic text-3xl leading-none text-foreground/8 select-none group-hover:text-[var(--gold)]/15 transition-colors"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <span className="text-[var(--gold)]/30 text-xs">◆</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
