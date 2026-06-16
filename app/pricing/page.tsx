'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ArrowLeft, Zap, Loader2, CreditCard, Smartphone, Building, Lock, ShieldCheck, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Script from 'next/script'

interface PlanFeature {
  text: string
  included: boolean
}

interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  popular: boolean
  features: PlanFeature[]
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with a single export pipeline',
    price: 0,
    popular: false,
    features: [
      { text: '1 Active Export Pipeline', included: true },
      { text: 'Manual Exports', included: true },
      { text: 'CSV & JSON format', included: true },
      { text: 'Scheduled Automations', included: false },
      { text: 'Slack & Email Delivery', included: false },
      { text: 'Team Collaboration', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams automating their data workflows',
    price: 29,
    popular: true,
    features: [
      { text: 'Unlimited Export Pipelines', included: true },
      { text: 'Automated Scheduling (Daily/Weekly)', included: true },
      { text: 'Slack & Email Delivery', included: true },
      { text: 'Up to 10 Data Sources', included: true },
      { text: 'Team Members (Up to 5)', included: true },
      { text: 'CSV & JSON formats', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For large organizations needing custom deliveries',
    price: 99,
    popular: false,
    features: [
      { text: 'All Pro Features', included: true },
      { text: 'Google Drive Integration', included: true },
      { text: 'Priority Email Support', included: true },
      { text: 'Up to 50 Data Sources', included: true },
      { text: 'Team Members (Up to 25)', included: true },
      { text: 'Custom Execution Logs', included: true },
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [mockDialog, setMockDialog] = useState<{
    open: boolean
    planId: string
    billingCycle: 'monthly' | 'annual'
    amount: number
    currency: string
  } | null>(null)

  // Mock Payment States
  const [mockTab, setMockTab] = useState<'card' | 'upi' | 'netbanking'>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentStep, setPaymentStep] = useState<'details' | 'otp'>('details')
  const [bankOtp, setBankOtp] = useState('')

  async function handleUpgrade(planId: string) {
    if (planId === 'free') {
      router.push('/dashboard')
      return
    }

    setLoadingPlan(planId)
    try {
      const response = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment order')
      }

      const data = await response.json()

      if (data.mock) {
        // Show mock payment overlay
        setMockDialog({
          open: true,
          planId,
          billingCycle,
          amount: data.amount,
          currency: data.currency,
        })
        return
      }

      // Live/Test Razorpay Flow
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'SyncDesk',
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: data.order_id,
        prefill: {
          email: data.userEmail || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (res: any) {
          setLoadingPlan(planId)
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
                planId,
                mock: false,
              }),
            })

            if (!verifyRes.ok) {
              const errData = await verifyRes.json().catch(() => ({}))
              throw new Error(errData.error || 'Signature verification failed')
            }

            toast.success('Successfully upgraded your account!', {
              description: 'You now have unlimited pipeline capacity.',
            })
            router.push('/pricing/success?plan=' + planId)
            router.refresh()
          } catch (err: any) {
            toast.error('Payment verification failed', {
              description: err.message || 'Please contact support.',
            })
          } finally {
            setLoadingPlan(null)
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null)
            toast.warning('Payment cancelled.')
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      toast.error('Could not initiate checkout', {
        description: err.message || 'Please try again later.',
      })
      setLoadingPlan(null)
    }
  }

  const closeMockDialog = () => {
    setMockDialog(null)
    setMockTab('card')
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
    setCardName('')
    setUpiId('')
    setSelectedBank('')
    setIsProcessingPayment(false)
    setPaymentStep('details')
    setBankOtp('')
  }

  async function handleMockPayment(success: boolean) {
    if (!mockDialog) return
    const { planId } = mockDialog
    
    // Close and reset states
    closeMockDialog()

    if (!success) {
      toast.error('Mock payment failed.')
      setLoadingPlan(null)
      return
    }

    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          mock: true,
        }),
      })

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to update plan status')
      }

      toast.success('Successfully upgraded your account (Mock)!', {
        description: 'You now have unlimited pipeline capacity.',
      })
      router.push('/pricing/success?plan=' + planId)
      router.refresh()
    } catch (err: any) {
      toast.error('Failed to apply upgrade', {
        description: err.message,
      })
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Navigation header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 group text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Back to dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              SyncDesk
            </span>
          </div>
        </div>
      </header>

      {/* Main pricing body */}
      <main className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
        {/* Title / Header */}
        <div className="text-center mb-16 animate-fade-rise">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Upgrade your pipeline capacity
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground max-w-md mx-auto">
            Choose a plan to unlock automated delivery and unlimited export pipelines.
          </p>
        </div>

        {/* Annual / Monthly Billing toggle */}
        <div className="flex justify-center mb-12 animate-fade-rise" style={{ animationDelay: '100ms' }}>
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={loadingPlan !== null}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={loadingPlan !== null}
            >
              Annual billing <span className="text-success-foreground font-bold">(Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Pricing grids */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch animate-fade-rise" style={{ animationDelay: '200ms' }}>
          {PLANS.map((plan) => {
            const price = billingCycle === 'annual' ? Math.round(plan.price * 0.8) : plan.price
            const isFree = plan.id === 'free'
            const isUpgrading = loadingPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 ${
                  plan.popular
                    ? 'border-primary ring-1 ring-primary/20 md:scale-105 z-10 hover:shadow-md'
                    : 'border-border hover:border-primary/30 hover:shadow-md'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <span className="mb-4 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    Most Popular
                  </span>
                )}

                {/* Plan Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-normal min-h-[32px]">
                    {plan.description}
                  </p>

                  {/* Price display */}
                  <div className="mt-6 flex items-baseline text-foreground">
                    <span className="text-4xl font-bold tracking-tight">${price}</span>
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">
                      /month
                    </span>
                  </div>
                  {billingCycle === 'annual' && !isFree && (
                    <span className="text-[11px] text-success font-medium mt-1 block">
                      Billed annually (${price * 12}/yr)
                    </span>
                  )}
                  {isFree && (
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      No credit card required
                    </span>
                  )}

                  {/* Features list */}
                  <ul className="mt-8 space-y-3.5 border-t border-border pt-6">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            feature.included ? 'text-primary' : 'text-muted-foreground/30'
                          }`}
                        />
                        <span className={`text-xs ${feature.included ? 'text-foreground' : 'text-muted-foreground/50 line-through'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button Action */}
                <div className="mt-8">
                  {isFree ? (
                    <Button
                      variant="outline"
                      className="w-full text-xs h-9"
                      onClick={() => handleUpgrade('free')}
                      disabled={loadingPlan !== null}
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      className="w-full text-xs h-9 gap-1.5"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loadingPlan !== null}
                    >
                      {isUpgrading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isUpgrading
                        ? 'Initiating...'
                        : billingCycle === 'annual'
                          ? `Upgrade Annual`
                          : `Upgrade Monthly`}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Mock payment overlay */}
      {mockDialog && mockDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-up flex flex-col gap-4 relative overflow-hidden">
            <style>{`
              @keyframes scan {
                0%, 100% { top: 0%; }
                50% { top: 100%; }
              }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Secure Checkout</h3>
                  <p className="text-[10px] text-muted-foreground">Merchant: SyncDesk Technologies</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Amount to Pay</span>
                <span className="text-sm font-extrabold text-foreground">
                  ₹{(mockDialog.amount / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {paymentStep === 'details' ? (
              <>
                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setMockTab('card')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                      mockTab === 'card'
                        ? 'bg-card text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockTab('upi')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                      mockTab === 'upi'
                        ? 'bg-card text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockTab('netbanking')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                      mockTab === 'netbanking'
                        ? 'bg-card text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building className="h-3.5 w-3.5" />
                    Netbanking
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="py-2 flex-1 min-h-[220px]">
                  {mockTab === 'card' && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary pl-9"
                            maxLength={19}
                          />
                          <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '')
                              if (v.length >= 2) {
                                setCardExpiry(`${v.slice(0, 2)}/${v.slice(2, 4)}`)
                              } else {
                                setCardExpiry(v)
                              }
                            }}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-center"
                            maxLength={5}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">CVV</label>
                          <input
                            type="password"
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-center"
                            maxLength={4}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  {mockTab === 'upi' && (
                    <div className="flex flex-col gap-4 items-center justify-center animate-fade-in text-center">
                      <div className="relative border border-border bg-card rounded-xl p-3 shadow-inner">
                        <div className="absolute inset-x-0 h-0.5 bg-primary opacity-60 animate-[scan_2s_ease-in-out_infinite]" />
                        <svg width="100" height="100" viewBox="0 0 100 100" className="text-foreground">
                          {/* QR Code markers */}
                          <rect x="5" y="5" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
                          <rect x="10" y="10" width="12" height="12" rx="1" fill="currentColor" />
                          <rect x="73" y="5" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
                          <rect x="78" y="10" width="12" height="12" rx="1" fill="currentColor" />
                          <rect x="5" y="73" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
                          <rect x="10" y="78" width="12" height="12" rx="1" fill="currentColor" />
                          {/* Random QR code pixels */}
                          <rect x="33" y="5" width="6" height="6" fill="currentColor" />
                          <rect x="45" y="12" width="12" height="6" fill="currentColor" />
                          <rect x="33" y="22" width="6" height="12" fill="currentColor" />
                          <rect x="45" y="22" width="18" height="6" fill="currentColor" />
                          <rect x="5" y="33" width="6" height="18" fill="currentColor" />
                          <rect x="15" y="45" width="18" height="6" fill="currentColor" />
                          <rect x="25" y="33" width="6" height="6" fill="currentColor" />
                          <rect x="33" y="45" width="6" height="18" fill="currentColor" />
                          <rect x="45" y="45" width="18" height="18" fill="currentColor" />
                          <rect x="73" y="33" width="12" height="6" fill="currentColor" />
                          <rect x="85" y="40" width="6" height="12" fill="currentColor" />
                          <rect x="73" y="50" width="6" height="12" fill="currentColor" />
                          <rect x="80" y="60" width="12" height="6" fill="currentColor" />
                          <rect x="33" y="73" width="12" height="6" fill="currentColor" />
                          <rect x="33" y="80" width="6" height="12" fill="currentColor" />
                          <rect x="45" y="85" width="18" height="6" fill="currentColor" />
                          <rect x="73" y="73" width="6" height="6" fill="currentColor" />
                          <rect x="85" y="73" width="12" height="12" fill="currentColor" />
                          <rect x="75" y="85" width="12" height="6" fill="currentColor" />
                        </svg>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Scan QR code using any UPI App (BHIM, PhonePe, GPay, Paytm)</p>
                      <div className="w-full flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] text-muted-foreground uppercase">or enter UPI ID</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <input
                        type="text"
                        placeholder="username@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-center"
                      />
                    </div>
                  )}

                  {mockTab === 'netbanking' && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Select Popular Bank</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'sbi', name: 'State Bank of India' },
                          { id: 'hdfc', name: 'HDFC Bank' },
                          { id: 'icici', name: 'ICICI Bank' },
                          { id: 'axis', name: 'Axis Bank' },
                          { id: 'kotak', name: 'Kotak Bank' },
                          { id: 'yes', name: 'Yes Bank' },
                        ].map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => setSelectedBank(bank.id)}
                            className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
                              selectedBank === bank.id
                                ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/30 font-semibold'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/30'
                            }`}
                          >
                            <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs truncate">{bank.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={async () => {
                      if (mockTab === 'card') {
                        if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
                          toast.error('Validation Error', { description: 'Please fill in all card details.' })
                          return
                        }
                        if (cardNumber.length !== 19) {
                           toast.error('Validation Error', { description: 'Card number must be 16 digits.' })
                           return
                        }
                        const [mm, yy] = cardExpiry.split('/')
                        if (!mm || !yy || parseInt(mm) < 1 || parseInt(mm) > 12) {
                           toast.error('Validation Error', { description: 'Invalid expiry month. Use MM/YY.' })
                           return
                        }
                        const currentYear = parseInt(new Date().getFullYear().toString().slice(-2))
                        const currentMonth = new Date().getMonth() + 1
                        if (parseInt(yy) < currentYear || (parseInt(yy) === currentYear && parseInt(mm) < currentMonth)) {
                           toast.error('Validation Error', { description: 'Card has expired.' })
                           return
                        }
                        if (cardCvv.length < 3) {
                          toast.error('Validation Error', { description: 'CVV must be at least 3 digits.' })
                          return
                        }
                        if (cardName.trim().split(' ').length < 2) {
                           toast.error('Validation Error', { description: 'Please enter your full name as on the card.' })
                           return
                        }
                      } else if (mockTab === 'upi') {
                        if (!upiId.trim()) {
                          // Allow payment if they just want to mock QR scan
                        } else if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
                          toast.error('Validation Error', { description: 'Please enter a valid UPI ID (e.g. yourname@okbank).' })
                          return
                        }
                      } else if (mockTab === 'netbanking') {
                        if (!selectedBank) {
                          toast.error('Validation Error', { description: 'Please select a bank.' })
                          return
                        }
                      }

                      setIsProcessingPayment(true)
                      setPaymentStatus('Establishing secure TLS tunnel...')
                      
                      setTimeout(() => {
                        setPaymentStatus('Verifying credentials via AI nexus...')
                      }, 800)
                      
                      setTimeout(() => {
                        setPaymentStatus('Authorizing transaction...')
                      }, 1600)

                      setTimeout(() => {
                        setIsProcessingPayment(false)
                        setPaymentStatus('')
                        if (mockTab === 'upi') {
                          handleMockPayment(true)
                        } else {
                          setPaymentStep('otp')
                        }
                      }, 2400)
                    }}
                    className="w-full cursor-pointer rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 relative overflow-hidden group"
                  >
                    {isProcessingPayment && (
                       <div className="absolute inset-0 bg-primary-foreground/10 animate-pulse" />
                    )}
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {paymentStatus || 'Processing Secure Payment...'}
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        Pay ₹{(mockDialog.amount / 100).toLocaleString('en-IN')} Now
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                    <button
                      type="button"
                      onClick={() => handleMockPayment(false)}
                      className="hover:text-destructive transition-colors text-[10px] bg-transparent border-0 cursor-pointer"
                    >
                      Simulate Failure
                    </button>
                    <button
                      type="button"
                      onClick={closeMockDialog}
                      className="hover:text-foreground transition-colors text-[10px] bg-transparent border-0 cursor-pointer"
                    >
                      Cancel Checkout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* OTP verification step */
              <div className="flex flex-col gap-4 py-4 animate-fade-in">
                <div className="text-center flex flex-col gap-2">
                  <ShieldCheck className="h-10 w-10 text-primary mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-foreground">3D Secure OTP Verification</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-normal">
                    Enter the mock 6-digit OTP code sent to your registered mobile number for authentication.
                  </p>
                </div>

                <div className="flex flex-col gap-2 max-w-xs mx-auto w-full">
                  <input
                    type="text"
                    placeholder="123456"
                    value={bankOtp}
                    onChange={(e) => setBankOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-3.5 text-center text-sm font-bold tracking-[0.5em] text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/30"
                    maxLength={6}
                    autoFocus
                  />
                  <span className="text-[10px] text-muted-foreground text-center">Tip: You can enter any 6 digits (e.g. 123456)</span>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={async () => {
                      if (bankOtp.length !== 6) {
                        toast.error('Validation Error', { description: 'Please enter a 6-digit OTP code.' })
                        return
                      }
                      setIsProcessingPayment(true)
                      setPaymentStatus('Decoding encrypted token...')
                      
                      setTimeout(() => {
                         setPaymentStatus('Validating 3D secure hash...')
                      }, 800)

                      setTimeout(() => {
                        setIsProcessingPayment(false)
                        setPaymentStatus('')
                        handleMockPayment(true)
                      }, 1800)
                    }}
                    className="w-full cursor-pointer rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 relative overflow-hidden group"
                  >
                    {isProcessingPayment && (
                       <div className="absolute inset-0 bg-primary-foreground/10 animate-pulse" />
                    )}
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {paymentStatus || 'Verifying OTP...'}
                      </>
                    ) : (
                      'Submit OTP & Complete Upgrade'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStep('details')}
                    className="text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1 bg-transparent border-0 cursor-pointer"
                  >
                    Back to Payment Methods
                  </button>
                </div>
              </div>
            )}

            {/* Trusted footer */}
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground/60 border-t border-border/50 pt-2.5 mt-1">
              <ShieldCheck className="h-3 w-3 text-success" />
              PCI-DSS Compliant 256-Bit SSL Secured Encryption
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
