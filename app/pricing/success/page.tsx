import Link from 'next/link'
import { Check, ShieldCheck, ArrowRight } from 'lucide-react'

export default function PricingSuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const planId = searchParams.plan || 'pro'
  
  const isBusiness = planId === 'business'
  const planName = isBusiness ? 'Business Plan' : 'Pro Plan'
  
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 selection:bg-primary/20">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative animate-scale-up">
          {/* Header */}
          <div className="bg-success/10 border-b border-success/20 p-8 text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 bg-success/20 blur-3xl w-40 h-40 rounded-full animate-pulse" />
            <div className="absolute -bottom-12 -left-12 bg-primary/20 blur-3xl w-40 h-40 rounded-full animate-pulse" />
            
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center mb-6 shadow-lg animate-fade-rise shadow-success/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
              <p className="text-success font-medium mt-2">
                Your workspace is now on the <span className="font-extrabold">{planName}</span>.
              </p>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Newly Unlocked Features
            </h3>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">Unlimited Export Pipelines</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">Automated Delivery Scheduling</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">Slack & Email Notifications</span>
              </li>
              {isBusiness && (
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">Google Drive Integration & Priority Support</span>
                </li>
              )}
            </ul>
            
            <div className="border-t border-border pt-6 mt-6">
              <Link 
                href="/dashboard"
                className="flex items-center justify-center w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors group gap-2 shadow-md shadow-primary/20"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in">
          A receipt has been sent to your registered email address.
        </p>
      </div>
    </div>
  )
}
