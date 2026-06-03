'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { ThemeToggle } from './ThemeToggle'

interface NavbarProps {
  locale: string
}

const locales = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

export function Navbar({ locale }: NavbarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { isSignedIn } = useUser()

  const localePath = useMemo(() => `/${locale}`, [locale])
  const currentPath = useMemo(() => pathname?.startsWith(`/${locale}`) ? pathname : localePath, [pathname, locale, localePath])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(11,7,8,0.85)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href={{ pathname: localePath }} className="flex items-center gap-3 text-lg font-semibold text-[var(--text)]">
          <span className="text-2xl">🍍</span>
          <span>THE PLAYROOM</span>
        </Link>
        <div className="hidden items-center gap-3 md:flex">
          <nav className="flex items-center gap-3">
            {locales.map(item => (
              <Link
                key={item.code}
                href={{ pathname: `/${item.code}` }}
                className={`rounded-full px-3 py-1 text-sm ${item.code === locale ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          {isSignedIn ? (
            <UserButton />
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton>
                <button className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--primary)]">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="btn-primary rounded-full px-4 py-2 text-sm">
                  Join Free
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          ☰
        </button>
      </div>
      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {locales.map(item => (
              <Link key={item.code} href={{ pathname: `/${item.code}` }} className="rounded-full px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ThemeToggle />
            {isSignedIn ? (
              <UserButton />
            ) : (
              <div className="flex flex-col gap-2">
                <SignInButton>
                  <button className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]">Sign In</button>
                </SignInButton>
                <SignUpButton>
                  <button className="btn-primary rounded-full px-4 py-2 text-sm">Join Free</button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
