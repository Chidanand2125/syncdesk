import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OnboardingCanvas } from '@/components/landing/onboarding-canvas'
import {
  Database,
  FileSpreadsheet,
  Lock,
  Repeat,
  Sparkles,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant exports',
    body: 'Turn any source into clean CSV or JSON in a single click — properly escaped, perfectly formatted.',
  },
  {
    icon: Repeat,
    title: 'Auto-delivery scheduler',
    body: 'Schedule a daily drop to an email address or Slack webhook. Set it once, never think about it again.',
  },
  {
    icon: Lock,
    title: 'Tenant isolation',
    body: 'Postgres Row Level Security means your workspace only ever sees its own pipelines. No leaks, by design.',
  },
  {
    icon: FileSpreadsheet,
    title: 'No per-seat tax',
    body: 'Flat, predictable pricing. Add your whole team without watching the bill balloon per head.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              SyncDesk
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/login">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-6">
            <Badge
              variant="secondary"
              className="w-fit gap-1.5 rounded-full px-3 py-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              The anti-bloat export utility
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Clean data exports, delivered on autopilot.
            </h1>
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              SyncDesk extracts raw system data into beautifully formatted CSV
              and JSON sheets — then auto-delivers them to your inbox or Slack
              on a schedule. No per-seat premiums. No usage traps.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-1.5">
                <Link href={user ? '/dashboard' : '/auth/login'}>
                  {user ? 'Open dashboard' : 'Start free with Google'}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#how">See how it works</Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-success" /> RLS-secured
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-success" /> Sub-second exports
              </span>
            </div>
          </div>

          <div id="how" className="scroll-mt-24">
            <OnboardingCanvas />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
                Everything you need. Nothing you don&apos;t.
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Built for teams that just want their data out, formatted, and
                on schedule.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-sidebar p-12 text-center text-sidebar-foreground">
            <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
              Stop paying the per-seat tax for a CSV.
            </h2>
            <p className="max-w-md text-pretty text-sidebar-foreground/70">
              Spin up your first export pipeline in under a minute.
            </p>
            <Button asChild size="lg">
              <Link href={user ? '/dashboard' : '/auth/login'}>
                {user ? 'Open dashboard' : 'Get started free'}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between px-6 py-6 text-sm text-muted-foreground gap-4">
          <span>SyncDesk</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">Refund</Link>
            <span className="hidden sm:inline-block">· Tenant-isolated · Secure by design</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
