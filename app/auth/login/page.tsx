import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from '@/components/auth/auth-form'
import { Database, ShieldCheck, Zap } from 'lucide-react'

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Database className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">SyncDesk</span>
        </Link>

        <div className="flex flex-col gap-6">
          <h1 className="text-balance text-3xl font-semibold leading-tight">
            Ship clean data exports in seconds — without the per-seat tax.
          </h1>
          <ul className="flex flex-col gap-4 text-sm text-sidebar-foreground/80">
            <li className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-success" />
              Instant CSV &amp; JSON from any source
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-success" />
              Row-level tenant isolation by default
            </li>
            <li className="flex items-center gap-3">
              <Database className="h-4 w-4 text-success" />
              Auto-deliver to email or Slack on a schedule
            </li>
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/50">
          Trusted by data teams who refuse to overpay for bloated platforms.
        </p>
      </section>

      {/* Auth panel */}
      <section className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-rise">
          <div className="mb-8 flex flex-col gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-5 w-5" />
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome to SyncDesk
          </h2>
          <p className="mb-8 mt-1.5 text-sm text-muted-foreground">
            Sign in to manage your export pipelines.
          </p>
          <AuthForm />
        </div>
      </section>
    </main>
  )
}
