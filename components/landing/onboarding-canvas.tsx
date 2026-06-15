'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { SOURCES } from '@/components/dashboard/source-meta'
import {
  ArrowRight,
  Check,
  Clock,
  Mail,
  Slack,
  type LucideIcon,
} from 'lucide-react'
import type { SourceType } from '@/lib/types'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

const STEPS = ['Sign in', 'Connect source', 'Set schedule'] as const

export function OnboardingCanvas() {
  const [step, setStep] = useState(0)
  const [source, setSource] = useState<SourceType>('stripe')
  const [scheduleOn, setScheduleOn] = useState(true)
  const [delivery, setDelivery] = useState<'email' | 'slack'>('slack')

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-2 shadow-xl shadow-foreground/5">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-chart-4/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
      </div>

      <div className="rounded-xl bg-background p-6">
        {/* Step rail */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  step >= i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {step > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:inline',
                  step >= i ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 rounded-full transition-colors',
                    step > i ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Sign in */}
        {step === 0 && (
          <div className="flex animate-fade-rise flex-col items-center gap-4 py-4 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              Secure sign-in
            </h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              One click with Google. No credit card, no per-seat pricing.
            </p>
            <Button
              className="mt-2 h-11 w-full max-w-xs gap-2.5"
              variant="outline"
              onClick={() => setStep(1)}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </div>
        )}

        {/* Step 2 — Connect source */}
        {step === 1 && (
          <div className="flex animate-fade-rise flex-col gap-4">
            <h3 className="text-center text-lg font-semibold text-foreground">
              Connect a data source
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {SOURCES.map((s) => {
                const active = source === s.type
                const Icon: LucideIcon = s.icon
                return (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => setSource(s.type)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200',
                      active
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30'
                        : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {s.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <Button onClick={() => setStep(2)} className="mt-2 gap-1.5">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 3 — Set schedule */}
        {step === 2 && (
          <div className="flex animate-fade-rise flex-col gap-4">
            <h3 className="text-center text-lg font-semibold text-foreground">
              Set your auto-delivery
            </h3>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  Daily auto-delivery
                </span>
                <span className="text-xs text-muted-foreground">
                  Sent every morning, automatically.
                </span>
              </div>
              <Switch checked={scheduleOn} onCheckedChange={setScheduleOn} />
            </div>

            {scheduleOn && (
              <div className="flex animate-fade-rise flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDelivery('email')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-all',
                      delivery === 'email'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <Mail className="h-4 w-4" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelivery('slack')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-all',
                      delivery === 'slack'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <Slack className="h-4 w-4" /> Slack
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="demo-endpoint">
                    {delivery === 'email' ? 'Recipient email' : 'Slack webhook'}
                  </Label>
                  <Input
                    id="demo-endpoint"
                    placeholder={
                      delivery === 'email'
                        ? 'team@company.com'
                        : 'https://hooks.slack.com/services/…'
                    }
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Delivered daily at 09:00
                </div>
              </div>
            )}

            <Button asChild className="mt-2 gap-1.5">
              <Link href="/auth/login">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
