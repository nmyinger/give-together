import Link from 'next/link'

const steps = [
  {
    number: '01',
    icon: '🔍',
    title: 'Browse live auctions',
    description:
      'Discover exclusive experiences — dinners, coaching sessions, and conversations with remarkable individuals.',
    action: { label: 'See all auctions', href: '/' },
  },
  {
    number: '02',
    icon: '💳',
    title: 'Add a payment method',
    description:
      'Securely save a card via Stripe. You are never charged upfront — only charged if you win.',
    action: { label: 'Set up payment', href: '/account' },
  },
  {
    number: '03',
    icon: '⚡',
    title: 'Place your bid',
    description:
      'Bid in real time with one click. All participants see every bid instantly as it happens.',
    action: null,
  },
  {
    number: '04',
    icon: '🎉',
    title: 'Win and give back',
    description:
      'The highest bidder wins. 100% of the winning amount goes directly to the celebrity\'s chosen charity.',
    action: null,
  },
]

export function HowItWorks() {
  return (
    <section className="py-6 space-y-7">
      <div className="flex items-center gap-4">
        <h2 className="font-display italic text-xl text-foreground shrink-0">How it works</h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground shrink-0">4 simple steps</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="relative rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
          >
            {/* Connector line between cards (desktop only, except last) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-8 -right-2 w-4 h-px bg-border z-10" />
            )}

            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">{step.icon}</span>
              <span
                className="font-display italic text-3xl leading-none text-foreground/8 select-none group-hover:text-[var(--gold)]/20 transition-colors"
                aria-hidden="true"
              >
                {step.number}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </div>

            {step.action && (
              <Link
                href={step.action.href}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2 transition-colors"
              >
                {step.action.label} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
