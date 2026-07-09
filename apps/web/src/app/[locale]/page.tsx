import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

interface PageProps {
  params: {
    locale: string
  }
}

export default function Page({ params }: PageProps) {
  setRequestLocale(params.locale)
  const hero = useTranslations('hero')
  const nav = useTranslations('nav')
  const how = useTranslations('howItWorks')
  const account = useTranslations('accountTypes')
  const privacy = useTranslations('privacy')
  const kinkTest = useTranslations('kinkTest')
  const events = useTranslations('events')
  const marketplace = useTranslations('marketplace')
  const pricing = useTranslations('pricing')
  const faq = useTranslations('faq')
  const footer = useTranslations('footer')

  const localePath = `/${params.locale}`
  const pricingLink = `${localePath}#pricing`
  const howItWorksLink = `${localePath}#how-it-works`

  const steps = [
    { icon: '👤', title: how('step1Title'), desc: how('step1Desc') },
    { icon: '🍍', title: how('step2Title'), desc: how('step2Desc') },
    { icon: '💫', title: how('step3Title'), desc: how('step3Desc') },
    { icon: '📍', title: how('step4Title'), desc: how('step4Desc') },
  ]

  const accountCards = [
    { icon: '👩', title: account('femaleSingle'), desc: account('femaleSingleDesc'), badge: 'Most popular' },
    { icon: '👨', title: account('maleSingle'), desc: account('maleSingleDesc') },
    { icon: '👫', title: account('coupleMF'), desc: account('coupleDesc') },
    { icon: '👬', title: account('coupleMM'), desc: account('coupleDesc') },
    { icon: '👭', title: account('coupleFF'), desc: account('coupleDesc') },
    { icon: '🏛️', title: account('swingClub'), desc: account('swingClubDesc'), badge: 'Free account' },
    { icon: '🛍️', title: account('sexShop'), desc: account('sexShopDesc'), badge: 'Free account' },
  ]

  const features = [
    { title: privacy('e2eTitle'), desc: privacy('e2eDesc') },
    { title: privacy('verifiedTitle'), desc: privacy('verifiedDesc') },
    { title: privacy('locationTitle'), desc: privacy('locationDesc') },
    { title: privacy('gdprTitle'), desc: privacy('gdprDesc') },
  ]

  const trustBadges = ['🔒 E2E Encrypted', '✅ Verified profiles', '🍍 Lifestyle community']
  const faqItems = [
    { q: faq('q1'), a: faq('a1') },
    { q: faq('q2'), a: faq('a2') },
    { q: faq('q3'), a: faq('a3') },
    { q: faq('q4'), a: faq('a4') },
  ]

  return (
    <div className="relative overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,31,61,0.15),_transparent_40%)]" />
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=80"
            alt="Tasteful lifestyle scene"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="relative max-w-3xl space-y-6">
            <span className="inline-flex rounded-full bg-[var(--primary)] px-4 py-1 text-xs uppercase tracking-[0.3em] text-white">
              {hero('badge')}
            </span>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight lg:text-6xl">
              {hero('headline')}
            </h1>
            <p className="max-w-2xl text-lg text-[var(--text-muted)] lg:text-xl">
              {hero('subheadline')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/${params.locale}/sign-up`} className="btn-primary inline-flex items-center justify-center">
                {nav('joinFree')}
              </Link>
              <Link href={`/${params.locale}/sign-in`} className="btn-outline inline-flex items-center justify-center">
                {nav('signIn')}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
              {trustBadges.map(badge => (
                <span key={badge} className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-2">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">{how('title')}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="card animate-fade-in-up">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                {step.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-[var(--text-muted)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-semibold">{account('title')}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {accountCards.map(card => (
            <div key={card.title} className="card group relative overflow-hidden">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl">{card.icon}</span>
                <div>
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                  {card.badge ? <span className="text-sm text-[var(--primary)]">{card.badge}</span> : null}
                </div>
              </div>
              <p className="text-[var(--text-muted)]">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">{privacy('title')}</p>
            <h2 className="mt-4 text-4xl font-semibold">{privacy('title')}</h2>
            <p className="mt-6 max-w-xl text-[var(--text-muted)]">{privacy('e2eDesc')}</p>
          </div>
          <div className="grid gap-4">
            {features.map(feature => (
              <div key={feature.title} className="card">
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-[var(--text-muted)]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
          <div className="card bg-[var(--surface)]">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">{kinkTest('title')}</p>
            <h2 className="mt-4 text-3xl font-semibold">{kinkTest('subtitle')}</h2>
            <p className="mt-6 text-[var(--text-muted)]">{kinkTest('desc')}</p>
            <Link href={{ pathname: localePath, hash: 'pricing' }} className="btn-primary mt-8 inline-flex">
              {kinkTest('cta')}
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="grid gap-3">
              {['Dom 🟢', 'Soft swap 🟡', 'Voyeur 🟢', 'Group play 🟡', 'Full swap 🔴'].map(tag => (
                <span key={tag} className="inline-flex rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm">
                  {tag}
                </span>
              ))}
            </div>
            <div className="absolute bottom-6 right-6 animate-float rounded-3xl bg-[var(--primary)]/10 p-4 text-sm text-[var(--text)] shadow-lg">
              Your archetype: The Adventurer 🍍
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-semibold">{events('title')}</h2>
          <p className="mt-4 text-[var(--text-muted)]">{events('desc')}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { title: 'Lisbon Sunset Party', date: 'Jun 14', location: 'Lisboa', vip: true },
            { title: 'VIP Club Night', date: 'Jun 20', location: 'Lisboa', vip: false },
            { title: 'Private Swing Mixer', date: 'Jun 28', location: 'Lisboa', vip: false },
          ].map(event => (
            <div key={event.title} className="card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">{event.title}</h3>
                {event.vip ? <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white">VIP</span> : null}
              </div>
              <p className="text-[var(--text-muted)]">{event.date} · 📍 {event.location} (exact location after acceptance)</p>
              <p className="mt-4 text-[var(--text-muted)]">Capacity: 24 people</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--primary)]">{marketplace('title')}</p>
            <h2 className="mt-4 text-4xl font-semibold">{marketplace('title')}</h2>
            <p className="mt-6 text-[var(--text-muted)]">{marketplace('desc')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card min-h-[180px]">
                <div className="mb-4 h-32 rounded-3xl bg-gradient-to-br from-[rgba(255,31,61,0.15)] to-[rgba(199,0,122,0.15)]" />
                <p className="font-semibold">Product placeholder</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-semibold">{pricing('title')}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card border border-[var(--border)] bg-[var(--surface)]">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">{pricing('free')}</p>
            <h3 className="mt-4 text-3xl font-semibold">{pricing('free')}</h3>
            <p className="mt-4 text-[var(--text-muted)]">{pricing('freeDesc')}</p>
            <button className="mt-8 w-full rounded-xl border border-[var(--border)] bg-transparent px-6 py-3 text-sm font-semibold text-[var(--text)]">
              Current plan
            </button>
          </div>
          <div className="card border border-[var(--primary)] bg-[var(--surface)]">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">VIP Female Single</p>
            <h3 className="mt-4 text-3xl font-semibold">{pricing('femaleSinglePrice')}</h3>
            <p className="mt-4 text-[var(--text-muted)]">{pricing('monthly')}/mês</p>
            <button className="btn-primary mt-8 w-full">Choose VIP</button>
          </div>
          <div className="card border border-[var(--border)] bg-[var(--surface)]">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">VIP Male Single</p>
            <h3 className="mt-4 text-3xl font-semibold">{pricing('maleSinglePrice')}</h3>
            <p className="mt-4 text-[var(--text-muted)]">{pricing('monthly')}/mês</p>
            <button className="btn-outline mt-8 w-full">Choose VIP</button>
          </div>
        </div>
        <div className="mt-12 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-2)] p-8 lg:p-12">
          <h3 className="text-2xl font-semibold">{pricing('businessFree')}</h3>
          <p className="mt-4 text-[var(--text-muted)]">{pricing('businessAddon')}</p>
          <p className="mt-4 text-xl font-semibold">{pricing('businessAddonPrice')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-semibold">{faq('title')}</h2>
        </div>
        <div className="grid gap-4">
          {faqItems.map(item => (
            <details key={item.q} className="card open:border-[var(--primary)]">
              <summary className="cursor-pointer text-lg font-semibold">{item.q}</summary>
              <p className="mt-3 text-[var(--text-muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-5">
          <div>
            <p className="text-2xl font-semibold">🍍 THE PLAYROOM</p>
            <p className="mt-4 text-[var(--text-muted)]">Privacy-first lifestyle matchmaking for the scene.</p>
          </div>
          <div>
            <p className="font-semibold">Product</p>
            <ul className="mt-4 space-y-2 text-[var(--text-muted)]">
              <li>Features</li>
              <li>Pricing</li>
              <li>Marketplace</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Account types</p>
            <ul className="mt-4 space-y-2 text-[var(--text-muted)]">
              <li>Singles</li>
              <li>Couples</li>
              <li>VIP</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Legal</p>
            <ul className="mt-4 space-y-2 text-[var(--text-muted)]">
              <li>{footer('terms')}</li>
              <li>{footer('privacy')}</li>
              <li>{footer('cookies')}</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Follow us</p>
            <ul className="mt-4 space-y-2 text-[var(--text-muted)]">
              <li>Instagram</li>
              <li>Club</li>
              <li>Partners</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-[var(--border)] pt-6 text-center text-[var(--text-muted)]">
          <p>© Amplia Solutions 2026</p>
        </div>
      </footer>
    </div>
  )
}
