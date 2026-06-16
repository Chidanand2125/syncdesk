import Link from 'next/link'

export default function RefundPage() {
  return (
    <div className="min-h-svh bg-background text-foreground py-16 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold mb-4">Refund and Cancellation Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: June 2026</p>
        
        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <h2 className="text-2xl font-medium mb-3">1. Cancellation Window</h2>
            <p>You may cancel your flat-rate billing cycles at any time directly via your user billing settings. There are no long-term lock-ins.</p>
          </section>

          <section>
            <h2 className="text-2xl font-medium mb-3">2. 7-Day Money-Back Guarantee</h2>
            <p>We offer a 100% full refund if integration pipeline mapping fails within the first 7 days of your paid subscription.</p>
          </section>

          <section>
            <h2 className="text-2xl font-medium mb-3">3. Processing Refunds</h2>
            <p>Emailed requests via <a href="mailto:support@yourdomain.com" className="text-primary hover:underline">support@yourdomain.com</a> are automatically processed through Razorpay gateways to original payment sources within 5-7 working days.</p>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-sm text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
