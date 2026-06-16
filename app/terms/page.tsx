import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-svh bg-background text-foreground py-16 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold mb-4">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: June 2026</p>
        
        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <h2 className="text-2xl font-medium mb-3">1. Flat-Rate Subscription Model</h2>
            <p>We operate on a flat-rate access tier, granting unlimited team seats under a single tenant. Predictable pricing ensures your team can scale without unexpected costs.</p>
          </section>

          <section>
            <h2 className="text-2xl font-medium mb-3">2. Acceptable Use</h2>
            <p>Users must refrain from malicious database query scraping or any form of registry misuse. Accessing the system in ways that harm performance or violate fair usage is prohibited.</p>
          </section>

          <section>
            <h2 className="text-2xl font-medium mb-3">3. Liability Limitation</h2>
            <p>The Service is provided &quot;as-is&quot;. Database connectivity limits and overall performance rest on upstream network states. We hold no liability for disruptions beyond our immediate infrastructure.</p>
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
